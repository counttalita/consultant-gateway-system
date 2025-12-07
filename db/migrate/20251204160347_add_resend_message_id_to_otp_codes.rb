class AddResendMessageIdToOtpCodes < ActiveRecord::Migration[8.1]
  def change
    add_column :otp_codes, :resend_message_id, :string
  end
end
