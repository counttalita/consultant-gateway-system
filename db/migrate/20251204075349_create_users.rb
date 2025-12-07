class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.text :roles, null: false, default: "[]"
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :active
  end
end
