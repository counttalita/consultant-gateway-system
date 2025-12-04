class CreateAirtableCaches < ActiveRecord::Migration[8.1]
  def change
    create_table :airtable_caches do |t|
      t.string :table, null: false
      t.string :record_id, null: false
      t.jsonb :data, default: {}
      t.datetime :cached_at, null: false

      t.timestamps
    end

    add_index :airtable_caches, [ :table, :record_id ], unique: true
    add_index :airtable_caches, :cached_at
    add_index :airtable_caches, :data, using: :gin
  end
end
