class OnboardingService
  class Error < StandardError; end
  class InvalidStepError < Error; end
  class StepNotReadyError < Error; end

  STEPS = [
    { name: "personal_info", required: true },
    { name: "banking", required: true },
    { name: "skills", required: true },
    { name: "contract", required: true },
    { name: "welcome", required: false }
  ].freeze

  def initialize(consultant)
    @consultant = consultant
  end

  def initialize_onboarding
    return if @consultant.onboarding_status != "pending"

    @consultant.update!(onboarding_status: "in_progress")

    # Initialize steps if not already present
    STEPS.each do |step_config|
      @consultant.onboarding_steps.find_or_create_by!(step_name: step_config[:name])
    end
  end

  def resume_onboarding
    initialize_onboarding if @consultant.onboarding_steps.empty?

    AuditLog.create!(
      action: "onboarding_resumed",
      resource_type: "Consultant",
      resource_id: @consultant.id,
      user: @consultant.user,
      change_data: { status: @consultant.onboarding_status }
    )

    {
      completed_steps: @consultant.onboarding_steps.completed.count,
      total_steps: STEPS.count,
      current_step: @consultant.onboarding_steps.where(status: [ "pending", "in_progress" ]).ordered.first
    }
  end

  def complete_step(step_name, data = {})
    step = @consultant.onboarding_steps.find_by(step_name: step_name)
    raise InvalidStepError, "Invalid step: #{step_name}" unless step

    # Ensure previous step is completed
    if (prev_step = step.previous_step) && !prev_step.completed?
      raise StepNotReadyError, "Previous step must be completed first"
    end

    # Validate step data based on step name
    validate_step_data(step_name, data)

    # Update step
    step.update!(
      status: "completed",
      completed_at: Time.current,
      data: data
    )

    # Update consultant data based on step
    update_consultant_from_step(step_name, data)

    # Check if all required steps are complete
    check_completion
  end

  def status
    {
      status: @consultant.onboarding_status,
      steps: @consultant.onboarding_steps.order(:id).map do |step|
        {
          name: step.step_name,
          status: step.status,
          completed_at: step.completed_at,
          required: STEPS.find { |s| s[:name] == step.step_name }[:required]
        }
      end,
      progress: calculate_progress
    }
  end

  private

  def validate_step_data(step_name, data)
    case step_name
    when "personal_info"
      raise Error, "Bio is required" if data["bio"].blank?
      raise Error, "Phone is required" if data["phone"].blank?
    when "banking"
      required = %w[bank_name account_number branch_code account_type]
      missing = required - data.keys
      raise Error, "Missing banking fields: #{missing.join(', ')}" if missing.any?
    when "skills"
      raise Error, "Skills are required" if data["skills"].blank?
    when "contract"
      raise Error, "Contract must be accepted" unless data["contract_accepted"]
    when "welcome"
      # No validation needed
    end
  end

  def update_consultant_from_step(step_name, data)
    case step_name
    when "personal_info"
      @consultant.update!(
        bio: data["bio"],
        metadata: (@consultant.metadata || {}).merge(phone: data["phone"], linkedin_url: data["linkedin_url"])
      )
    when "banking"
      @consultant.update!(banking_details: data)
    when "skills"
      @consultant.update!(skills: data["skills"])
    when "contract"
      @consultant.update!(metadata: (@consultant.metadata || {}).merge(contract_accepted: true, signed_at: Time.current))
    end
  end

  def check_completion
    return if @consultant.onboarding_status == "completed"

    required_steps = STEPS.select { |s| s[:required] }.map { |s| s[:name] }
    completed_steps = @consultant.onboarding_steps.where(status: "completed").pluck(:step_name)

    if (required_steps - completed_steps).empty?
      @consultant.update!(onboarding_status: "completed")

      # Sync to Airtable
      ProfileSyncJob.perform_later(@consultant.id, { status: "Active" })

      # Send welcome email
      Adapters::ResendAdapter.send_email(
        to: @consultant.user.email,
        template: "welcome_pack",
        variables: { name: @consultant.user.email }
      )

      # Log completion
      AuditLog.create!(
        action: "onboarding_completed",
        resource_type: "Consultant",
        resource_id: @consultant.id,
        user: @consultant.user,
        change_data: { status: "completed" }
      )
    end
  end

  def calculate_progress
    total_steps = STEPS.count
    completed_steps = @consultant.onboarding_steps.where(status: "completed").count
    return 0 if total_steps.zero?

    ((completed_steps.to_f / total_steps) * 100).round
  end
end
