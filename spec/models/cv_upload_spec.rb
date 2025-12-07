require 'rails_helper'

RSpec.describe CvUpload, type: :model do
  it "is valid with valid attributes" do
    consultant = create(:consultant)
    cv_upload = build(:cv_upload, consultant: consultant)

    # Attach a file
    cv_upload.file.attach(
      io: StringIO.new("dummy content"),
      filename: "cv.pdf",
      content_type: "application/pdf"
    )

    expect(cv_upload).to be_valid
  end

  it "is invalid without a file" do
    consultant = create(:consultant)
    cv_upload = build(:cv_upload, consultant: consultant)
    cv_upload.file.purge # Explicitly remove the file attached by factory

    expect(cv_upload).not_to be_valid
    expect(cv_upload.errors[:file]).to include("can't be blank")
  end

  it "is invalid with an unsupported file type" do
    consultant = create(:consultant)
    cv_upload = build(:cv_upload, consultant: consultant)

    # Attach a text file (unsupported)
    cv_upload.file.attach(
      io: StringIO.new("dummy content"),
      filename: "cv.txt",
      content_type: "text/plain"
    )

    expect(cv_upload).not_to be_valid
    expect(cv_upload.errors[:file]).to include("Must be a PDF or DOCX file")
  end

  it "is valid with a DOCX file" do
    consultant = create(:consultant)
    cv_upload = build(:cv_upload, consultant: consultant)

    # Attach a DOCX file
    cv_upload.file.attach(
      io: StringIO.new("dummy content"),
      filename: "cv.docx",
      content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    expect(cv_upload).to be_valid
  end
end
