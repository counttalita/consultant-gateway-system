class CreateConsultants < ActiveRecord::Migration[8.1]
  def change
    create_table :consultants do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.text :bio
      t.jsonb :skills, default: []
      t.jsonb :banking_details
      t.string :airtable_id
      t.string :harvest_id
      t.string :xero_id
      t.string :availability_status, default: "available"
      t.decimal :utilization_percentage, precision: 5, scale: 2, default: 0.0
      t.string :onboarding_status, default: "pending"

      t.timestamps
    end

    add_index :consultants, :airtable_id, unique: true, where: "airtable_id IS NOT NULL"
    add_index :consultants, :harvest_id, unique: true, where: "harvest_id IS NOT NULL"
    add_index :consultants, :xero_id, unique: true, where: "xero_id IS NOT NULL"
    add_index :consultants, :availability_status
    add_index :consultants, :onboarding_status
    add_index :consultants, :skills, using: :gin
  end
end
