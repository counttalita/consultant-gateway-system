class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :token, null: false
      t.datetime :expires_at, null: false
      t.datetime :last_activity_at
      t.inet :ip_address

      t.timestamps
    end

    add_index :sessions, :token, unique: true
    add_index :sessions, :expires_at
    add_index :sessions, :last_activity_at
  end
end
