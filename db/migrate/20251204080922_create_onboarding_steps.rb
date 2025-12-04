class CreateOnboardingSteps < ActiveRecord::Migration[8.1]
  def change
    create_table :onboarding_steps do |t|
      t.references :consultant, null: false, foreign_key: true, index: true
      t.string :step_name, null: false
      t.string :status, null: false, default: "pending"
      t.jsonb :data, default: {}
      t.datetime :completed_at

      t.timestamps
    end

    add_index :onboarding_steps, [ :consultant_id, :step_name ], unique: true
    add_index :onboarding_steps, :status
    add_index :onboarding_steps, :completed_at
  end
end
