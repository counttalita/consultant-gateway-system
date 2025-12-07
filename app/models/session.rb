class Session < ApplicationRecord
  # Associations
  belongs_to :user

  # Validations
  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  # Callbacks
  before_validation :generate_token, on: :create
  before_validation :set_expiration, on: :create
  before_create :set_last_activity

  # Scopes
  scope :active, -> { where("expires_at > ?", Time.current) }
  scope :expired, -> { where("expires_at <= ?", Time.current) }
  scope :recent_activity, -> { where("last_activity_at > ?", 1.hour.ago) }
  scope :inactive, -> { where("last_activity_at <= ?", 1.hour.ago) }

  # Constants
  SESSION_DURATION = 24.hours
  ACTIVITY_TIMEOUT = 30.minutes

  # Class methods
  def self.create_for_user(user, ip_address: nil)
    create!(
      user: user,
      ip_address: ip_address
    )
  end

  def self.cleanup_expired
    expired.delete_all
  end

  # Instance methods
  def active?
    !expired?
  end

  def expired?
    expires_at <= Time.current
  end

  def touch_activity!
    update!(last_activity_at: Time.current)
  end

  def extend_session!
    update!(expires_at: SESSION_DURATION.from_now)
  end

  def time_remaining
    return 0 if expired?
    (expires_at - Time.current).to_i
  end

  def inactive_duration
    return 0 if last_activity_at.nil?
    (Time.current - last_activity_at).to_i
  end

  def should_extend?
    # Extend session if more than half the duration has passed
    time_remaining < (SESSION_DURATION / 2)
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiration
    self.expires_at ||= SESSION_DURATION.from_now
  end

  def set_last_activity
    self.last_activity_at ||= Time.current
  end
end
