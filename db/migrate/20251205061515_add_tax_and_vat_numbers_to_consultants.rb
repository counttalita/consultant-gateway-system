class AddTaxAndVatNumbersToConsultants < ActiveRecord::Migration[8.1]
  def change
    add_column :consultants, :tax_number, :string
    add_column :consultants, :vat_number, :string
  end
end
