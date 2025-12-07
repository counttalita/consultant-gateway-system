class AddManualReviewFieldsToConsultants < ActiveRecord::Migration[8.1]
  def change
    add_column :consultants, :needs_manual_review, :boolean, default: false, null: false
    add_column :consultants, :manual_review_reason, :text
  end
end
