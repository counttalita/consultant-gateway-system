class Consultant < ApplicationRecord
  # Associations
  belongs_to :user
  has_many :onboarding_steps, dependent: :destroy
  has_many :project_assignments, dependent: :destroy
  has_many :projects, through: :project_assignments

  # Encryption
  encrypts :banking_details

  # Validations
  validates :bio, length: { maximum: 1000 }, allow_blank: true
  validates :availability_status, inclusion: { in: %w[available partially_available unavailable] }
  validates :onboarding_status, inclusion: { in: %w[pending in_progress completed] }
  validates :utilization_percentage, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :airtable_id, uniqueness: true, allow_nil: true
  validates :harvest_id, uniqueness: true, allow_nil: true
  validates :xero_id, uniqueness: true, allow_nil: true
  validate :skills_must_be_array
  validate :banking_details_structure

  # Callbacks
  before_validation :ensure_skills_is_array

  # Scopes
  scope :active, -> { joins(:user).where(users: { active: true }) }
  scope :available, -> { where(availability_status: "available") }
  scope :partially_available, -> { where(availability_status: "partially_available") }
  scope :unavailable, -> { where(availability_status: "unavailable") }
  scope :onboarding_pending, -> { where(onboarding_status: "pending") }
  scope :onboarding_in_progress, -> { where(onboarding_status: "in_progress") }
  scope :onboarding_completed, -> { where(onboarding_status: "completed") }
  scope :with_skill, ->(skill) { where("skills @> ?", [skill].to_json) }
  scope :synced_to_airtable, -> { where.not(airtable_id: nil) }
  scope :synced_to_harvest, -> { where.not(harvest_id: nil) }
  scope :synced_to_xero, -> { where.not(xero_id: nil) }
  scope :fully_synced, -> { where.not(airtable_id: nil, harvest_id: nil, xero_id: nil) }
  scope :high_utilization, -> { where("utilization_percentage >= ?", 80) }
  scope :low_utilization, -> { where("utilization_percentage < ?", 50) }

  # Instance methods
  def add_skill(skill)
    self.skills = (skills + [skill.to_s]).uniq
  end

  def remove_skill(skill)
    self.skills = skills - [skill.to_s]
  end

  def has_skill?(skill)
    skills.include?(skill.to_s)
  end

  def onboarding_complete?
    onboarding_status == "completed"
  end

  def available?
    availability_status == "available"
  end

  def synced_to_all_systems?
    airtable_id.present? && harvest_id.present? && xero_id.present?
  end

  def profile_complete?
    bio.present? && skills.any? && banking_details.present?
  end

  def update_utilization!
    # Calculate utilization based on project assignments
    total_hours = project_assignments.active.sum(:allocated_hours) rescue 0
    available_hours = 160 # Standard monthly hours
    self.utilization_percentage = (total_hours.to_f / available_hours * 100).round(2)
    save
  end

  private

  def ensure_skills_is_array
    self.skills = [] if skills.nil?
    self.skills = Array(skills) unless skills.is_a?(Array)
  end

  def skills_must_be_array
    errors.add(:skills, "must be an array") unless skills.is_a?(Array)
  end

  def banking_details_structure
    return if banking_details.blank?

    required_keys = %w[bank_name account_number branch_code account_type]
    missing_keys = required_keys - banking_details.keys

    if missing_keys.any?
      errors.add(:banking_details, "missing required fields: #{missing_keys.join(', ')}")
    end
  end
end
