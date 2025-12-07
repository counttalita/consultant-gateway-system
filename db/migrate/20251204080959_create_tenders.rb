class CreateTenders < ActiveRecord::Migration[8.1]
  def change
    create_table :tenders do |t|
      t.string :reference_number, null: false
      t.string :title, null: false
      t.string :source
      t.decimal :tender_value, precision: 15, scale: 2
      t.datetime :submission_deadline
      t.jsonb :required_capabilities, default: []
      t.string :airtable_id
      t.string :bid_decision, default: "pending"
      t.decimal :bid_score, precision: 5, scale: 2
      t.text :bid_rationale

      t.timestamps
    end

    add_index :tenders, :reference_number, unique: true
    add_index :tenders, :airtable_id, unique: true, where: "airtable_id IS NOT NULL"
    add_index :tenders, :bid_decision
    add_index :tenders, :submission_deadline
    add_index :tenders, :required_capabilities, using: :gin
  end
end
