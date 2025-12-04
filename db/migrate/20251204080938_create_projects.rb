class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name, null: false
      t.string :client_name, null: false
      t.string :airtable_deal_id
      t.string :clickup_project_id
      t.string :clickup_url
      t.string :drive_folder_id
      t.string :drive_url
      t.string :status, null: false, default: "setup"
      t.date :start_date
      t.date :end_date

      t.timestamps
    end

    add_index :projects, :airtable_deal_id, unique: true, where: "airtable_deal_id IS NOT NULL"
    add_index :projects, :clickup_project_id, unique: true, where: "clickup_project_id IS NOT NULL"
    add_index :projects, :status
    add_index :projects, :client_name
    add_index :projects, :start_date
    add_index :projects, :end_date
  end
end
