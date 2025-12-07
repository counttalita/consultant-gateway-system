class OtpCode < ApplicationRecord
  # Associations
  belongs_to :user

  # Validations
  validates :code, presence: true, format: { with: /\A\d{6}\z/, message: "must be a 6-digit number" }
  validates :expires_at, presence: true
  validates :resend_message_id, presence: true, if: :email_sent?

  # Callbacks
  before_validation :set_expiration, on: :create

  # Scopes
  scope :still_valid, -> { where("expires_at > ? AND consumed_at IS NULL", Time.current) }
  scope :expired, -> { where("expires_at <= ?", Time.current) }
  scope :consumed, -> { where.not(consumed_at: nil) }
  scope :unconsumed, -> { where(consumed_at: nil) }
  scope :recent, -> { where("created_at > ?", 1.hour.ago) }
  scope :for_email, ->(email) { joins(:user).where(users: { email: email }) }

  # Constants
  EXPIRATION_TIME = 10.minutes
  CODE_LENGTH = 6

  # Class methods
  def self.generate_for_user(user, ip_address: nil)
    code = SecureRandom.random_number(10**CODE_LENGTH).to_s.rjust(CODE_LENGTH, "0")

    create!(
      user: user,
      code: code,
      ip_address: ip_address
    )
  end

  def self.rate_limit_exceeded?(user)
    where(user: user)
      .where("created_at > ?", 15.minutes.ago)
      .count >= 3
  end

  # Instance methods
  def still_valid?
    !expired? && !consumed?
  end

  def expired?
    expires_at <= Time.current
  end

  def consumed?
    consumed_at.present?
  end

  def consume!
    update!(consumed_at: Time.current)
  end

  def time_remaining
    return 0 if expired?
    (expires_at - Time.current).to_i
  end

  def email_sent?
    # Email is considered sent if we have a message ID
    resend_message_id.present?
  end

  def store_message_id(message_id)
    update!(resend_message_id: message_id)
  end

  private

  def set_expiration
    self.expires_at ||= EXPIRATION_TIME.from_now
  end
end
