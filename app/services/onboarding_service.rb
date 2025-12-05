# frozen_string_literal: true

# Service for managing consultant onboarding workflow
# Handles step progression, validation, and completion triggers
class OnboardingService
  class InvalidStepError < StandardError; end
  class ValidationError < StandardError; end
  class StepNotReadyError < StandardError; end

  STEP_VALIDATORS = {
    "personal_info" => :validate_personal_info,
    "banking" => :validate_banking,
    "skills" => :validate_skills,
    "contract" => :validate_contract,
    "welcome" => :validate_welcome
  }.freeze

  # Initialize onboarding steps for a consultant
  # @param consultant [Consultant] The consultant to initialize onboarding for
  # @return [Array<OnboardingStep>] The created onboarding steps
  def initialize_onboarding(consultant)
    # Create all onboarding steps
    OnboardingStep.initialize_for_consultant(consultant)

    # Update consultant status
    consultant.update!(onboarding_status: "in_progress")

    # Log the initialization
    AuditLogger.log(
      action: :onboarding_initialized,
      resource: consultant,
      metadata: { step_count: OnboardingStep::STEP_ORDER.length }
    )

    consultant.onboarding_steps.ordered
  end

  # Get the current step for a consultant
  # @param consultant [Consultant] The consultant
  # @return [OnboardingStep, nil] The current step or nil if all complete
  def get_current_step(consultant)
    # Return first incomplete step
    consultant.onboarding_steps.ordered.find { |step| !step.completed? }
  end

  # Get onboarding progress for a consultant
  # @param consultant [Consultant] The consultant
  # @return [Hash] Progress information
  def get_progress(consultant)
    steps = consultant.onboarding_steps.ordered
    completed_count = steps.count(&:completed?)
    total_count = steps.count

    {
      total_steps: total_count,
      completed_steps: completed_count,
      current_step: get_current_step(consultant),
      progress_percentage: (completed_count.to_f / total_count * 100).round(2),
      steps: steps.map { |step| step_summary(step) }
    }
  end

  # Complete a specific onboarding step
  # @param consultant [Consultant] The consultant
  # @param step_name [String] The name of the step to complete
  # @param data [Hash] The data for the step
  # @param ip_address [String] Optional IP address for audit logging
  # @return [Hash] Result with success status and updated step
  def complete_step(consultant:, step_name:, data:, ip_address: nil)
    # Find the step
    step = consultant.onboarding_steps.find_by(step_name: step_name)
    raise InvalidStepError, "Invalid step: #{step_name}" unless step

    # Check if step is ready to be completed
    unless step.in_progress? || step.pending?
      raise StepNotReadyError, "Step #{step_name} is already completed"
    end

    # Check if previous step is completed (except for first step)
    if step.previous_step && !step.previous_step.completed?
      raise StepNotReadyError, "Previous step must be completed first"
    end

    # Validate the data for this step
    validator_method = STEP_VALIDATORS[step_name]
    if validator_method
      validation_result = send(validator_method, data, consultant)
      unless validation_result[:valid]
        return {
          success: false,
          errors: validation_result[:errors],
          step: step
        }
      end
    end

    # Apply the data to the consultant
    apply_step_data(consultant, step_name, data)

    # Mark step as completed
    step.complete!(data)

    # Log the completion
    AuditLogger.log(
      action: :onboarding_step_completed,
      resource: consultant,
      change_data: { step_name: step_name },
      metadata: { step_number: step.step_number, data_keys: data.keys }
    )

    # Reload consultant to ensure we have fresh data
    consultant.reload

    # Check if all steps are complete
    if all_steps_completed?(consultant)
      finalize_onboarding(consultant, ip_address: ip_address)
    end

    {
      success: true,
      step: step,
      next_step: step.next_step,
      all_complete: all_steps_completed?(consultant)
    }
  end

  # Finalize onboarding when all steps are complete
  # @param consultant [Consultant] The consultant
  # @param ip_address [String] Optional IP address for audit logging
  # @return [Boolean] true if finalization was successful
  def finalize_onboarding(consultant, ip_address: nil)
    # Mark consultant as completed
    consultant.update!(onboarding_status: "completed")

    # Mark consultant as "Active" in Airtable
    sync_to_airtable(consultant)

    # Trigger welcome pack automation
    trigger_welcome_pack(consultant)

    # Log the completion
    AuditLogger.log(
      action: :onboarding_completed,
      resource: consultant,
      change_data: { status: "completed" },
      ip_address: ip_address
    )

    true
  end

  # Resume onboarding from where consultant left off
  # @param consultant [Consultant] The consultant
  # @return [Hash] Current progress and next step
  def resume_onboarding(consultant)
    # Initialize steps if they don't exist
    if consultant.onboarding_steps.empty?
      initialize_onboarding(consultant)
    end

    # Get current progress
    progress = get_progress(consultant)

    # Log the resumption
    AuditLogger.log(
      action: :onboarding_resumed,
      resource: consultant,
      metadata: { current_step: progress[:current_step]&.step_name }
    )

    progress
  end

  private

  # Validate personal info step
  def validate_personal_info(data, consultant)
    errors = []

    errors << "First name is required" if data[:first_name].blank?
    errors << "Last name is required" if data[:last_name].blank?
    errors << "Phone number is required" if data[:phone_number].blank?
    errors << "ID number is required" if data[:id_number].blank?

    # Validate phone number format (South African)
    if data[:phone_number].present? && !valid_sa_phone?(data[:phone_number])
      errors << "Phone number must be a valid South African number"
    end

    # Validate ID number format (South African)
    if data[:id_number].present? && !valid_sa_id?(data[:id_number])
      errors << "ID number must be a valid South African ID"
    end

    { valid: errors.empty?, errors: errors }
  end

  # Validate banking step
  def validate_banking(data, consultant)
    errors = []

    required_fields = %w[bank_name account_number branch_code account_type]
    required_fields.each do |field|
      errors << "#{field.humanize} is required" if data[field.to_sym].blank?
    end

    # Validate account number (South African - typically 9-11 digits)
    if data[:account_number].present? && !valid_sa_account_number?(data[:account_number])
      errors << "Account number must be 9-11 digits"
    end

    # Validate branch code (South African - 6 digits)
    if data[:branch_code].present? && !valid_sa_branch_code?(data[:branch_code])
      errors << "Branch code must be 6 digits"
    end

    # Validate account type
    valid_account_types = %w[current savings transmission]
    if data[:account_type].present? && !valid_account_types.include?(data[:account_type])
      errors << "Account type must be one of: #{valid_account_types.join(', ')}"
    end

    { valid: errors.empty?, errors: errors }
  end

  # Validate skills step
  def validate_skills(data, consultant)
    errors = []

    if data[:skills].blank? || !data[:skills].is_a?(Array) || data[:skills].empty?
      errors << "At least one skill is required"
    end

    if data[:bio].present? && data[:bio].length > 1000
      errors << "Bio must be 1000 characters or less"
    end

    { valid: errors.empty?, errors: errors }
  end

  # Validate contract step
  def validate_contract(data, consultant)
    errors = []

    errors << "Contract acceptance is required" if data[:contract_accepted] != true
    errors << "Signature is required" if data[:signature].blank?
    errors << "Signature date is required" if data[:signed_at].blank?

    { valid: errors.empty?, errors: errors }
  end

  # Validate welcome step (no validation needed, auto-completed)
  def validate_welcome(data, consultant)
    { valid: true, errors: [] }
  end

  # Apply step data to consultant record
  def apply_step_data(consultant, step_name, data)
    case step_name
    when "personal_info"
      # Store in consultant or user record as needed
      # For now, we'll store in the step data itself
      # In production, you might update user.name, consultant.phone, etc.
    when "banking"
      consultant.update!(
        banking_details: {
          bank_name: data[:bank_name],
          account_number: data[:account_number],
          branch_code: data[:branch_code],
          account_type: data[:account_type]
        }
      )
    when "skills"
      consultant.update!(
        skills: data[:skills],
        bio: data[:bio]
      )
    when "contract"
      # Store contract signature data
      # In production, you might integrate with DocuSign or similar
    when "welcome"
      # No data to apply
    end
  end

  # Check if all steps are completed
  def all_steps_completed?(consultant)
    consultant.onboarding_steps.all?(&:completed?)
  end

  # Sync consultant to Airtable as "Active"
  def sync_to_airtable(consultant)
    # Queue background job for Airtable sync
    ProfileSyncJob.perform_later(consultant.id, { status: "Active" })
  rescue => e
    Rails.logger.error("Failed to queue Airtable sync for consultant #{consultant.id}: #{e.message}")
    # Don't fail onboarding if sync fails - it will be retried
  end

  # Trigger welcome pack automation
  def trigger_welcome_pack(consultant)
    # Send welcome email via Resend
    begin
      Adapters::ResendAdapter.send_email(
        to: consultant.user.email,
        template: "welcome_pack",
        variables: {
          name: consultant.user.email.split("@").first.titleize,
          portal_url: "#{ENV['APP_URL']}/portal"
        }
      )
    rescue => e
      Rails.logger.error("Failed to send welcome email to #{consultant.user.email}: #{e.message}")
      # Log but don't fail onboarding
      AuditLogger.log(
        action: :welcome_email_failed,
        resource: consultant,
        metadata: { error: e.message }
      )
    end
  end

  # Generate step summary
  def step_summary(step)
    {
      step_name: step.step_name,
      step_number: step.step_number,
      status: step.status,
      completed_at: step.completed_at,
      data: step.data
    }
  end

  # Validation helpers
  def valid_sa_phone?(phone)
    # South African phone numbers: +27 or 0 followed by 9 digits
    phone.to_s.gsub(/\D/, "").match?(/^(27|0)\d{9}$/)
  end

  def valid_sa_id?(id_number)
    # South African ID: 13 digits (YYMMDD + 4 digits + citizenship + 8th digit + checksum)
    id_number.to_s.match?(/^\d{13}$/)
  end

  def valid_sa_account_number?(account_number)
    # South African account numbers are typically 9-11 digits
    account_number.to_s.gsub(/\D/, "").match?(/^\d{9,11}$/)
  end

  def valid_sa_branch_code?(branch_code)
    # South African branch codes are 6 digits
    branch_code.to_s.gsub(/\D/, "").match?(/^\d{6}$/)
  end
end
