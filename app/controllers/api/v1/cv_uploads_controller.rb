module Api
  module V1
    class CvUploadsController < ApplicationController
      def create
        consultant = Consultant.find(params[:consultant_id])
        
        # Create CvUpload record
        cv_upload = consultant.cv_uploads.build
        cv_upload.file.attach(params[:file])
        
        if cv_upload.save
          begin
            # Parse CV
            parser = CvParserService.new(cv_upload.file)
            extracted_data = parser.parse
            
            # Pre-populate consultant skills (Requirement 2.4)
            if extracted_data[:skills].any?
              current_skills = consultant.skills || []
              new_skills = (current_skills + extracted_data[:skills]).uniq
              consultant.update(skills: new_skills)
            end
            
            render json: { 
              success: true, 
              cv_upload_id: cv_upload.id,
              extracted_data: extracted_data 
            }, status: :created
          rescue CvParserService::ParseError => e
            render json: { success: false, errors: [e.message] }, status: :unprocessable_entity
          end
        else
          render json: { success: false, errors: cv_upload.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { success: false, errors: ["Consultant not found"] }, status: :not_found
      end
    end
  end
end
