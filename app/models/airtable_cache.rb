class AirtableCache < ApplicationRecord
  # Validations
  validates :table, presence: true
  validates :record_id, presence: true, uniqueness: { scope: :table }
  validates :cached_at, presence: true

  # Callbacks
  before_validation :set_cached_at, on: :create

  # Scopes
  scope :for_table, ->(table_name) { where(table: table_name) }
  scope :fresh, -> { where("cached_at > ?", 5.minutes.ago) }
  scope :stale, -> { where("cached_at <= ?", 5.minutes.ago) }
  scope :recent, -> { order(cached_at: :desc) }

  # Constants
  CACHE_TTL = 5.minutes

  # Class methods
  def self.fetch(table, record_id)
    find_by(table: table, record_id: record_id)
  end

  def self.store(table, record_id, data)
    upsert(
      {
        table: table,
        record_id: record_id,
        data: data,
        cached_at: Time.current
      },
      unique_by: [ :table, :record_id ]
    )
  end

  def self.invalidate(table, record_id)
    where(table: table, record_id: record_id).delete_all
  end

  def self.invalidate_table(table)
    where(table: table).delete_all
  end

  def self.cleanup_stale(older_than: 1.day.ago)
    where("cached_at < ?", older_than).delete_all
  end

  # Instance methods
  def fresh?
    cached_at > CACHE_TTL.ago
  end

  def stale?
    !fresh?
  end

  def age
    Time.current - cached_at
  end

  def refresh!(new_data)
    update!(data: new_data, cached_at: Time.current)
  end

  private

  def set_cached_at
    self.cached_at ||= Time.current
  end
end
