class CreateCvUploads < ActiveRecord::Migration[8.1]
  def change
    create_table :cv_uploads do |t|
      t.references :consultant, null: false, foreign_key: true

      t.timestamps
    end
  end
end
