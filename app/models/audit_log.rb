class AuditLog < ApplicationRecord
  # Associations
  belongs_to :user, optional: true

  # Validations
  validates :action, presence: true

  # Scopes
  scope :for_user, ->(user) { where(user_id: user.id) }
  scope :for_resource, ->(resource) { where(resource_type: resource.class.name, resource_id: resource.id) }
  scope :recent, -> { order(created_at: :desc).limit(100) }
  scope :by_action, ->(action) { where(action: action) }
  scope :authentication_events, -> { where(action: %w[login logout otp_generated otp_validated]) }
  scope :profile_changes, -> { where(action: "profile_updated") }
  scope :financial_operations, -> { where(action: %w[invoice_created bill_created payment_processed]) }
  scope :admin_actions, -> { joins(:user).where("users.roles::text LIKE '%admin%'") }
  scope :in_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) }

  # Class methods
  def self.log(action, resource = nil, change_data: {}, metadata: {}, user: nil, ip_address: nil)
    create!(
      user: user,
      action: action.to_s,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      change_data: sanitize_sensitive_data(change_data),
      metadata: metadata,
      ip_address: ip_address
    )
  end

  def self.sanitize_sensitive_data(data)
    return {} if data.blank?

    sanitized = data.deep_dup
    sensitive_keys = %w[password banking_details account_number code token secret]

    sanitized.each do |key, value|
      if sensitive_keys.any? { |sk| key.to_s.include?(sk) }
        sanitized[key] = "[REDACTED]"
      elsif value.is_a?(Hash)
        sanitized[key] = sanitize_sensitive_data(value)
      end
    end

    sanitized
  end

  # Instance methods
  def resource
    return nil if resource_type.blank? || resource_id.blank?

    resource_type.constantize.find_by(id: resource_id)
  rescue NameError
    nil
  end

  def user_email
    user&.email || "System"
  end

  def formatted_changes
    return "No changes" if change_data.blank?

    change_data.map do |key, value|
      if value.is_a?(Hash) && value.key?("old") && value.key?("new")
        "#{key}: #{value['old']} → #{value['new']}"
      else
        "#{key}: #{value}"
      end
    end.join(", ")
  end
end
