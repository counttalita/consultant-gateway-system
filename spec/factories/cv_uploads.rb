FactoryBot.define do
  factory :cv_upload do
    consultant

    after(:build) do |cv_upload|
      cv_upload.file.attach(
        io: StringIO.new("dummy content"),
        filename: "cv.pdf",
        content_type: "application/pdf"
      )
    end
  end
end
