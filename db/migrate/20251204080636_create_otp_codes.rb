class CreateOtpCodes < ActiveRecord::Migration[8.1]
  def change
    create_table :otp_codes do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :code, null: false
      t.datetime :expires_at, null: false
      t.datetime :consumed_at
      t.inet :ip_address

      t.timestamps
    end

    add_index :otp_codes, [ :user_id, :code ]
    add_index :otp_codes, :expires_at
    add_index :otp_codes, :consumed_at
  end
end
