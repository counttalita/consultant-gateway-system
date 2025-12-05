class OnboardingStep < ApplicationRecord
  # Associations
  belongs_to :consultant

  # Validations
  validates :step_name, presence: true, uniqueness: { scope: :consultant_id }
  validates :status, presence: true, inclusion: { in: %w[pending in_progress completed] }
  validates :step_name, inclusion: { in: %w[personal_info banking_details tax_info cv_upload] }

  # Scopes
  scope :pending, -> { where(status: "pending") }
  scope :in_progress, -> { where(status: "in_progress") }
  scope :completed, -> { where(status: "completed") }
  scope :ordered, -> { order(:id) }
  scope :for_consultant, ->(consultant) { where(consultant: consultant) }

  # Constants
  STEP_ORDER = %w[personal_info banking_details tax_info cv_upload].freeze

  # Class methods
  def self.initialize_for_consultant(consultant)
    STEP_ORDER.each_with_index do |step_name, index|
      find_or_create_by!(consultant: consultant, step_name: step_name) do |step|
        step.status = index.zero? ? "in_progress" : "pending"
      end
    end
  end

  # Instance methods
  def complete!(data = {})
    update!(
      status: "completed",
      data: self.data.merge(data),
      completed_at: Time.current
    )

    # Mark next step as in_progress
    next_step&.start!
  end

  def start!
    update!(status: "in_progress") if pending?
  end

  def pending?
    status == "pending"
  end

  def in_progress?
    status == "in_progress"
  end

  def completed?
    status == "completed"
  end

  def next_step
    current_index = STEP_ORDER.index(step_name)
    return nil if current_index.nil? || current_index >= STEP_ORDER.length - 1

    next_step_name = STEP_ORDER[current_index + 1]
    consultant.onboarding_steps.find_by(step_name: next_step_name)
  end

  def previous_step
    current_index = STEP_ORDER.index(step_name)
    return nil if current_index.nil? || current_index.zero?

    prev_step_name = STEP_ORDER[current_index - 1]
    consultant.onboarding_steps.find_by(step_name: prev_step_name)
  end

  def step_number
    STEP_ORDER.index(step_name)&.+(1)
  end

  def total_steps
    STEP_ORDER.length
  end
end
