class AddMetadataToConsultants < ActiveRecord::Migration[8.1]
  def change
    add_column :consultants, :metadata, :jsonb, default: {}
  end
end
