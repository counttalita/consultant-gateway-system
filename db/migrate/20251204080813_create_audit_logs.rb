class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :user, foreign_key: true, index: true
      t.string :action, null: false
      t.string :resource_type
      t.integer :resource_id
      t.jsonb :change_data, default: {}
      t.inet :ip_address
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :audit_logs, [ :resource_type, :resource_id ]
    add_index :audit_logs, :action
    add_index :audit_logs, :created_at
    add_index :audit_logs, :change_data, using: :gin
    add_index :audit_logs, :metadata, using: :gin
  end
end
