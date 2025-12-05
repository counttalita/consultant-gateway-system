class AddAllocatedHoursToProjectAssignments < ActiveRecord::Migration[8.1]
  def change
    add_column :project_assignments, :allocated_hours, :decimal, precision: 8, scale: 2, default: 0.0, null: false
  end
end
