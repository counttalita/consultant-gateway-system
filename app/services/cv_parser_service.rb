# frozen_string_literal: true

require "pdf-reader"
require "docx"

class CvParserService
  class ParseError < StandardError; end

  # Initialize with the file attachment
  # @param file [ActiveStorage::Attached::One] The uploaded file attachment
  def initialize(file)
    @file = file
  end

  # Parse the CV and extract data
  # @return [Hash] Extracted data (skills, experience, etc.)
  def parse
    text = extract_text
    extract_data(text)
  end

  private

  def extract_text
    @file.open do |local_file|
      case @file.content_type
      when "application/pdf"
        parse_pdf(local_file)
      when "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        parse_docx(local_file)
      else
        raise ParseError, "Unsupported file type: #{@file.content_type}"
      end
    end
  rescue StandardError => e
    raise ParseError, "Failed to parse file: #{e.message}"
  end

  def parse_pdf(file)
    reader = PDF::Reader.new(file)
    reader.pages.map(&:text).join("\n")
  end

  def parse_docx(file)
    doc = Docx::Document.open(file)
    doc.paragraphs.map(&:text).join("\n")
  end

  def extract_data(text)
    {
      skills: extract_skills(text),
      experience: extract_experience(text),
      qualifications: extract_qualifications(text)
    }
  end

  def extract_skills(text)
    # List of common skills in the industry
    known_skills = [
      "Project Management", "Change Management", "Agile", "Scrum", "Kanban",
      "Business Analysis", "Strategic Planning", "Stakeholder Management",
      "Risk Management", "Process Improvement", "Leadership", "Communication",
      "Ruby on Rails", "React", "Angular", "Python", "Java", "SQL", "PostgreSQL",
      "AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "Terraform",
      "Financial Modeling", "Data Analysis", "Tableau", "Power BI", "Excel",
      "JIRA", "Confluence", "Trello", "Asana", "Slack", "Teams"
    ]

    known_skills.select { |skill| text.match?(/#{Regexp.escape(skill)}/i) }
  end

  def extract_experience(text)
    # Basic extraction looking for keywords indicating experience sections or durations
    # This is a placeholder for more advanced NLP logic
    experience_markers = []

    # Look for years of experience patterns (e.g. "5 years experience", "Senior", "Lead")
    if text.match?(/\d+\+?\s*years/i) || text.match?(/Senior|Lead|Manager|Director|Head of/i)
      experience_markers << "Experience detected"
    end

    experience_markers
  end

  def extract_qualifications(text)
    # Look for degree keywords
    degrees = [
      "Bachelor", "Master", "PhD", "MBA", "BSc", "BA", "MSc", "Diploma",
      "Certificate", "Certified", "PMP", "Prince2", "PROSCI"
    ]
    degrees.select { |degree| text.match?(/#{Regexp.escape(degree)}/i) }
  end
end
