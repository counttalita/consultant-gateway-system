class ProjectAssignment < ApplicationRecord
  # Associations
  belongs_to :project
  belongs_to :consultant

  # Validations
  validates :consultant_id, uniqueness: { scope: :project_id, message: "is already assigned to this project" }
  validates :allocated_hours, numericality: { greater_than_or_equal_to: 0 }, allow_nil: false
  validate :end_date_after_start_date

  # Scopes
  scope :active, -> { where("start_date <= ? AND (end_date IS NULL OR end_date >= ?)", Date.current, Date.current) }
  scope :upcoming, -> { where("start_date > ?", Date.current) }
  scope :past, -> { where("end_date < ?", Date.current) }
  scope :for_consultant, ->(consultant) { where(consultant: consultant) }
  scope :for_project, ->(project) { where(project: project) }
  scope :with_role, ->(role) { where(role: role) }

  # Callbacks
  after_create :update_consultant_availability
  after_update :update_consultant_availability, if: :saved_change_to_allocated_hours?
  after_destroy :update_consultant_availability

  # Instance methods
  def active?
    return false if start_date.nil? || start_date > Date.current
    end_date.nil? || end_date >= Date.current
  end

  def upcoming?
    start_date.present? && start_date > Date.current
  end

  def past?
    end_date.present? && end_date < Date.current
  end

  def duration_days
    return nil if start_date.nil? || end_date.nil?
    (end_date - start_date).to_i
  end

  private

  def end_date_after_start_date
    return if start_date.nil? || end_date.nil?

    if end_date < start_date
      errors.add(:end_date, "must be after start date")
    end
  end

  def update_consultant_availability
    # Use AvailabilityService to update consultant availability and utilization
    service = AvailabilityService.new
    service.update_on_project_assignment(consultant, self)
  rescue StandardError => e
    Rails.logger.error("Failed to update consultant availability after assignment: #{e.message}")
    # Don't raise - assignment should succeed even if availability update fails
  end
end
