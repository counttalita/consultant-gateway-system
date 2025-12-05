# frozen_string_literal: true

# Service for managing consultant availability and utilization
# Handles availability status updates, utilization calculations, and Airtable synchronization
class AvailabilityService
  class ValidationError < StandardError; end
  class SyncError < StandardError; end

  # Utilization thresholds
  HIGH_UTILIZATION_THRESHOLD = 80.0
  OVERUTILIZATION_THRESHOLD = 100.0
  STANDARD_MONTHLY_HOURS = 160.0

  # Airtable configuration
  AIRTABLE_BASE_ID = ENV.fetch("AIRTABLE_BASE_ID", "")
  TALENT_POOL_TABLE = "Talent Pool"

  # Update consultant availability status with Airtable sync
  # @param consultant [Consultant] The consultant to update
  # @param availability_status [String] New availability status
  # @return [Hash] Result with success status and any errors
  def update_availability(consultant, availability_status)
    # Validate availability status
    unless %w[available partially_available unavailable].include?(availability_status)
      return {
        success: false,
        errors: [ "Invalid availability status. Must be one of: available, partially_available, unavailable" ]
      }
    end

    # Update consultant
    consultant.availability_status = availability_status

    if consultant.save
      # Sync to Airtable
      sync_availability_to_airtable(consultant)

      # Log the update
      AuditLogger.log(
        action: :availability_update,
        resource: consultant,
        change_data: { availability_status: availability_status },
        metadata: { synced_to_airtable: true }
      )

      { success: true, consultant: consultant, errors: [] }
    else
      { success: false, consultant: consultant, errors: consultant.errors.full_messages }
    end
  rescue StandardError => e
    Rails.logger.error("Availability update failed for consultant #{consultant.id}: #{e.message}")
    { success: false, consultant: consultant, errors: [ "Availability update failed: #{e.message}" ] }
  end

  # Get talent pool view with availability and utilization
  # @param filters [Hash] Optional filters (availability_status, skills, min_utilization, max_utilization)
  # @return [Array<Consultant>] Filtered consultants with availability and utilization data
  def get_talent_pool(filters = {})
    consultants = Consultant.active.includes(:user, :project_assignments, :projects)

    # Filter by availability status
    if filters[:availability_status].present?
      consultants = consultants.where(availability_status: filters[:availability_status])
    end

    # Filter by skills
    if filters[:skills].present?
      skills_array = Array(filters[:skills])
      skills_array.each do |skill|
        consultants = consultants.with_skill(skill)
      end
    end

    # Filter by utilization range
    if filters[:min_utilization].present?
      consultants = consultants.where("utilization_percentage >= ?", filters[:min_utilization])
    end

    if filters[:max_utilization].present?
      consultants = consultants.where("utilization_percentage <= ?", filters[:max_utilization])
    end

    # Calculate current utilization for each consultant
    consultants.map do |consultant|
      {
        consultant: consultant,
        availability_status: consultant.availability_status,
        utilization_percentage: consultant.utilization_percentage || 0,
        skills: consultant.skills || [],
        active_projects: consultant.projects.where(status: "active").count,
        upcoming_projects: consultant.project_assignments.upcoming.count
      }
    end
  end

  # Filter consultants by required skills
  # @param required_skills [Array<String>] Skills required for the project
  # @param availability_filter [String] Optional availability filter
  # @return [Array<Consultant>] Consultants matching the skill requirements
  def filter_by_skills(required_skills, availability_filter: nil)
    return [] if required_skills.blank?

    consultants = Consultant.active.includes(:user, :project_assignments)

    # Filter by availability if specified
    if availability_filter.present?
      consultants = consultants.where(availability_status: availability_filter)
    end

    # Filter by skills - consultant must have ALL required skills
    required_skills.each do |skill|
      consultants = consultants.with_skill(skill)
    end

    # Sort by utilization (prefer lower utilization)
    consultants.order(utilization_percentage: :asc)
  end

  # Automatically update availability when consultant is assigned to a project
  # @param consultant [Consultant] The consultant being assigned
  # @param project_assignment [ProjectAssignment] The new project assignment
  # @return [Hash] Result with updated availability and utilization
  def update_on_project_assignment(consultant, project_assignment)
    # Recalculate utilization
    calculate_utilization(consultant)

    # Reload consultant to get updated utilization_percentage
    consultant.reload

    # Auto-update availability based on utilization
    new_availability = determine_availability_from_utilization(consultant.utilization_percentage)

    if consultant.availability_status != new_availability
      consultant.availability_status = new_availability
      consultant.save!
      consultant.reload

      # Sync to Airtable
      sync_availability_to_airtable(consultant)

      # Log the automatic update
      AuditLogger.log(
        action: :automatic_availability_update,
        resource: consultant,
        change_data: {
          availability_status: new_availability,
          utilization_percentage: consultant.utilization_percentage,
          trigger: "project_assignment",
          project_id: project_assignment.project_id
        },
        metadata: { synced_to_airtable: true }
      )
    end

    # Check for utilization threshold alerts
    check_utilization_thresholds(consultant)

    {
      success: true,
      consultant: consultant,
      availability_status: consultant.availability_status,
      utilization_percentage: consultant.utilization_percentage
    }
  rescue StandardError => e
    Rails.logger.error("Automatic availability update failed for consultant #{consultant.id}: #{e.message}")
    { success: false, errors: [ "Automatic update failed: #{e.message}" ] }
  end

  # Calculate consultant utilization based on project assignments
  # @param consultant [Consultant] The consultant to calculate utilization for
  # @return [Float] Utilization percentage
  def calculate_utilization(consultant)
    # Get active project assignments
    active_assignments = consultant.project_assignments.active

    # Sum allocated hours
    total_allocated_hours = active_assignments.sum(:allocated_hours) || 0

    # Calculate utilization percentage
    utilization = (total_allocated_hours.to_f / STANDARD_MONTHLY_HOURS * 100).round(2)

    # Update consultant record
    consultant.update_column(:utilization_percentage, utilization)

    utilization
  end

  # Check utilization thresholds and send alerts if exceeded
  # @param consultant [Consultant] The consultant to check
  # @return [Hash] Alert information if threshold exceeded
  def check_utilization_thresholds(consultant)
    utilization = consultant.utilization_percentage || 0

    if utilization >= OVERUTILIZATION_THRESHOLD
      send_utilization_alert(
        consultant: consultant,
        level: :critical,
        message: "Consultant #{consultant.user.email} is overutilized at #{utilization}%"
      )

      return {
        alert_sent: true,
        level: :critical,
        utilization: utilization,
        threshold: OVERUTILIZATION_THRESHOLD
      }
    elsif utilization >= HIGH_UTILIZATION_THRESHOLD
      send_utilization_alert(
        consultant: consultant,
        level: :warning,
        message: "Consultant #{consultant.user.email} has high utilization at #{utilization}%"
      )

      return {
        alert_sent: true,
        level: :warning,
        utilization: utilization,
        threshold: HIGH_UTILIZATION_THRESHOLD
      }
    end

    { alert_sent: false, utilization: utilization }
  end

  private

  # Sync availability to Airtable
  def sync_availability_to_airtable(consultant)
    return unless consultant.airtable_id.present?

    fields = {
      "Availability Status" => consultant.availability_status&.titleize || "Available",
      "Utilization %" => consultant.utilization_percentage || 0
    }

    Adapters::AirtableAdapter.update_record(
      base_id: AIRTABLE_BASE_ID,
      table: TALENT_POOL_TABLE,
      record_id: consultant.airtable_id,
      fields: fields
    )
  rescue Adapters::AirtableAdapter::ApiError => e
    Rails.logger.error("Airtable availability sync failed for consultant #{consultant.id}: #{e.message}")
    # Don't raise - availability update should succeed even if Airtable sync fails
  end

  # Determine availability status from utilization percentage
  def determine_availability_from_utilization(utilization)
    if utilization >= OVERUTILIZATION_THRESHOLD
      "unavailable"
    elsif utilization >= HIGH_UTILIZATION_THRESHOLD
      "partially_available"
    else
      "available"
    end
  end

  # Send utilization alert to resource managers
  def send_utilization_alert(consultant:, level:, message:)
    # Log the alert
    Rails.logger.warn("[UTILIZATION ALERT] #{level.upcase}: #{message}")

    # Create audit log entry
    AuditLogger.log(
      action: :utilization_alert,
      resource: consultant,
      metadata: {
        level: level,
        message: message,
        utilization: consultant.utilization_percentage,
        timestamp: Time.current
      }
    )

    # Send email notification to resource managers
    # Find users with admin or user role (resource managers)
    resource_managers = User.active.select { |user| user.has_role?("admin") || user.has_role?("user") }

    resource_managers.each do |manager|
      Adapters::ResendAdapter.send_email(
        to: manager.email,
        template: "admin_notification",
        variables: {
          subject: "Consultant Utilization Alert",
          message: message,
          priority: level == :critical ? "critical" : "high",
          details: {
            "Consultant" => consultant.user.email,
            "Utilization" => "#{consultant.utilization_percentage}%",
            "Threshold" => "#{level == :critical ? OVERUTILIZATION_THRESHOLD : HIGH_UTILIZATION_THRESHOLD}%",
            "Level" => level.to_s.upcase
          }
        }
      )
    end
  rescue StandardError => e
    Rails.logger.error("Failed to send utilization alert emails: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
  end
end
