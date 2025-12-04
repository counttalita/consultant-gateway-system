class CreateProjectAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :project_assignments do |t|
      t.references :project, null: false, foreign_key: true, index: true
      t.references :consultant, null: false, foreign_key: true, index: true
      t.string :role
      t.date :start_date
      t.date :end_date

      t.timestamps
    end

    add_index :project_assignments, [ :project_id, :consultant_id ], unique: true
    add_index :project_assignments, :start_date
    add_index :project_assignments, :end_date
  end
end
