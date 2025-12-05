class CvUpload < ApplicationRecord
  belongs_to :consultant
  has_one_attached :file

  validates :file, presence: true
  validate :correct_document_mime_type

  private

  def correct_document_mime_type
    if file.attached? && !file.content_type.in?(%w(application/pdf application/vnd.openxmlformats-officedocument.wordprocessingml.document))
      errors.add(:file, 'Must be a PDF or DOCX file')
    end
  end
end
