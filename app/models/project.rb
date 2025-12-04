class Project < ApplicationRecord
  # Associations
  has_many :project_assignments, dependent: :destroy
  has_many :consultants, through: :project_assignments

  # Validations
  validates :name, presence: true
  validates :client_name, presence: true
  validates :status, presence: true, inclusion: { in: %w[setup active completed archived] }
  validates :airtable_deal_id, uniqueness: true, allow_nil: true
  validates :clickup_project_id, uniqueness: true, allow_nil: true
  validate :end_date_after_start_date

  # Scopes
  scope :active, -> { where(status: "active") }
  scope :setup, -> { where(status: "setup") }
  scope :completed, -> { where(status: "completed") }
  scope :archived, -> { where(status: "archived") }
  scope :for_client, ->(client_name) { where(client_name: client_name) }
  scope :current, -> { where("start_date <= ? AND (end_date IS NULL OR end_date >= ?)", Date.current, Date.current) }
  scope :upcoming, -> { where("start_date > ?", Date.current) }
  scope :past, -> { where("end_date < ?", Date.current) }
  scope :recent, -> { order(created_at: :desc) }

  # Instance methods
  def activate!
    update!(status: "active", start_date: Date.current) if setup?
  end

  def complete!
    update!(status: "completed", end_date: Date.current) if active?
  end

  def archive!
    update!(status: "archived")
  end

  def setup?
    status == "setup"
  end

  def active?
    status == "active"
  end

  def completed?
    status == "completed"
  end

  def archived?
    status == "archived"
  end

  def duration_days
    return nil if start_date.nil? || end_date.nil?
    (end_date - start_date).to_i
  end

  def current?
    return false if start_date.nil?
    return false if start_date > Date.current

    end_date.nil? || end_date >= Date.current
  end

  def fully_setup?
    clickup_project_id.present? && drive_folder_id.present?
  end

  def add_consultant(consultant, role: nil, start_date: nil, end_date: nil)
    project_assignments.create!(
      consultant: consultant,
      role: role,
      start_date: start_date || self.start_date,
      end_date: end_date || self.end_date
    )
  end

  private

  def end_date_after_start_date
    return if start_date.nil? || end_date.nil?

    if end_date < start_date
      errors.add(:end_date, "must be after start date")
    end
  end
end
