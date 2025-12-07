class Tender < ApplicationRecord
  # Validations
  validates :reference_number, presence: true, uniqueness: true
  validates :title, presence: true
  validates :bid_decision, inclusion: { in: %w[pending pursue decline] }
  validates :airtable_id, uniqueness: true, allow_nil: true
  validates :tender_value, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :bid_score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 10 }, allow_nil: true
  validate :required_capabilities_must_be_array

  # Callbacks
  before_validation :ensure_required_capabilities_is_array

  # Scopes
  scope :pending, -> { where(bid_decision: "pending") }
  scope :pursue, -> { where(bid_decision: "pursue") }
  scope :declined, -> { where(bid_decision: "decline") }
  scope :upcoming_deadline, -> { where("submission_deadline > ?", Time.current).order(:submission_deadline) }
  scope :past_deadline, -> { where("submission_deadline <= ?", Time.current) }
  scope :high_value, -> { where("tender_value >= ?", 1_000_000) }
  scope :recent, -> { order(created_at: :desc) }
  scope :with_capability, ->(capability) { where("required_capabilities @> ?", [ capability ].to_json) }

  # Instance methods
  def mark_as_pursue!(score: nil, rationale: nil)
    update!(
      bid_decision: "pursue",
      bid_score: score,
      bid_rationale: rationale
    )
  end

  def mark_as_decline!(rationale: nil)
    update!(
      bid_decision: "decline",
      bid_rationale: rationale
    )
  end

  def pending?
    bid_decision == "pending"
  end

  def pursue?
    bid_decision == "pursue"
  end

  def declined?
    bid_decision == "decline"
  end

  def deadline_passed?
    submission_deadline.present? && submission_deadline < Time.current
  end

  def days_until_deadline
    return nil if submission_deadline.nil?
    return 0 if deadline_passed?

    ((submission_deadline - Time.current) / 1.day).ceil
  end

  def high_value?
    tender_value.present? && tender_value >= 1_000_000
  end

  def add_capability(capability)
    self.required_capabilities = (required_capabilities + [ capability.to_s ]).uniq
  end

  def remove_capability(capability)
    self.required_capabilities = required_capabilities - [ capability.to_s ]
  end

  def has_capability?(capability)
    required_capabilities.include?(capability.to_s)
  end

  private

  def ensure_required_capabilities_is_array
    self.required_capabilities = [] if required_capabilities.nil?
    self.required_capabilities = Array(required_capabilities) unless required_capabilities.is_a?(Array)
  end

  def required_capabilities_must_be_array
    errors.add(:required_capabilities, "must be an array") unless required_capabilities.is_a?(Array)
  end
end
