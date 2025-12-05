class OnboardingService
  class Error < StandardError; end
  class InvalidStepError < Error; end
  class StepNotReadyError < Error; end

  STEPS = [
    { name: "personal_info", required: true },
    { name: "banking_details", required: true },
    { name: "tax_info", required: false },
    { name: "cv_upload", required: true }
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

  def complete_step(step_name, data = {})
    step = @consultant.onboarding_steps.find_by(step_name: step_name)
    raise InvalidStepError, "Invalid step: #{step_name}" unless step

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
    when "banking_details"
      required = %w[bank_name account_number branch_code account_type]
      missing = required - data.keys
      raise Error, "Missing banking fields: #{missing.join(', ')}" if missing.any?
    when "cv_upload"
      # Validation handled by ActiveStorage presence check usually,
      # but here we might check if a file was uploaded in a separate call
    end
  end

  def update_consultant_from_step(step_name, data)
    case step_name
    when "personal_info"
      @consultant.update!(
        bio: data["bio"],
        metadata: (@consultant.metadata || {}).merge(phone: data["phone"], linkedin_url: data["linkedin_url"])
      )
    when "banking_details"
      @consultant.update!(banking_details: data)
    when "tax_info"
      @consultant.update!(
        tax_number: data["tax_number"],
        vat_number: data["vat_number"]
      )
    end
  end

  def check_completion
    required_steps = STEPS.select { |s| s[:required] }.map { |s| s[:name] }
    completed_steps = @consultant.onboarding_steps.where(status: "completed").pluck(:step_name)

    if (required_steps - completed_steps).empty?
      @consultant.update!(onboarding_status: "completed")
    end
  end

  def calculate_progress
    total_steps = STEPS.count
    completed_steps = @consultant.onboarding_steps.where(status: "completed").count
    return 0 if total_steps.zero?

    ((completed_steps.to_f / total_steps) * 100).round
  end
end
