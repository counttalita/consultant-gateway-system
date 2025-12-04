class User < ApplicationRecord
  # Associations
  has_one :consultant, dependent: :destroy
  has_many :otp_codes, dependent: :destroy
  has_many :sessions, dependent: :destroy
  has_many :audit_logs, dependent: :nullify

  # Serialization
  serialize :roles, coder: JSON

  # Validations
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :roles, presence: true
  validate :roles_must_be_array
  validate :roles_must_be_valid
  validate :consultant_role_restrictions

  # Callbacks
  before_validation :ensure_roles_is_array
  before_validation :normalize_email

  # Scopes
  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }
  scope :consultants, -> { joins(:consultant) }
  scope :internal_staff, -> { where("roles::text LIKE ANY(ARRAY['%admin%', '%finance%', '%user%'])") }
  scope :with_role, ->(role) { where("roles::text LIKE ?", "%#{role}%") }

  # Constants
  VALID_ROLES = %w[consultant admin finance user].freeze
  INTERNAL_ROLES = %w[admin finance user].freeze
  CONSULTANT_ROLE = "consultant"

  # Instance methods
  def has_role?(role_name)
    roles.include?(role_name.to_s)
  end

  def internal_staff?
    (roles & INTERNAL_ROLES).any?
  end

  def consultant?
    roles.include?(CONSULTANT_ROLE)
  end

  def add_role(role_name)
    return false unless VALID_ROLES.include?(role_name.to_s)
    return false if consultant? && role_name.to_s != CONSULTANT_ROLE

    self.roles = (roles + [role_name.to_s]).uniq
  end

  def remove_role(role_name)
    self.roles = roles - [role_name.to_s]
  end

  def permissions
    # Union of all permissions from assigned roles
    roles.flat_map { |role| permissions_for_role(role) }.uniq
  end

  private

  def ensure_roles_is_array
    self.roles = [] if roles.nil?
    self.roles = Array(roles) unless roles.is_a?(Array)
  end

  def normalize_email
    self.email = email.to_s.downcase.strip if email.present?
  end

  def roles_must_be_array
    errors.add(:roles, "must be an array") unless roles.is_a?(Array)
  end

  def roles_must_be_valid
    return unless roles.is_a?(Array)

    invalid_roles = roles - VALID_ROLES
    if invalid_roles.any?
      errors.add(:roles, "contains invalid roles: #{invalid_roles.join(', ')}")
    end
  end

  def consultant_role_restrictions
    return unless roles.is_a?(Array)
    return unless roles.include?(CONSULTANT_ROLE)

    if roles.length > 1
      errors.add(:roles, "consultant role cannot be combined with other roles")
    end
  end

  def permissions_for_role(role)
    case role
    when "admin"
      %w[manage_users manage_consultants manage_projects manage_tenders view_analytics manage_system]
    when "finance"
      %w[view_consultants view_projects view_financial_data manage_invoices manage_bills export_financial_data]
    when "user"
      %w[view_consultants view_projects]
    when "consultant"
      %w[manage_own_profile view_own_projects]
    else
      []
    end
  end
end
