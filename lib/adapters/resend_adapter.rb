# frozen_string_literal: true

require "net/http"
require "json"

# Adapter for Resend email service
# Handles email sending with retry logic and message ID tracking
module Adapters
  class ResendAdapter
    class EmailDeliveryError < StandardError; end
    class RateLimitError < StandardError; end
    class InvalidEmailError < StandardError; end

    # Retry configuration
    MAX_RETRIES = 3
    BASE_DELAY = 1.second
    RESEND_API_URL = "https://api.resend.com/emails"

    # Send email with retry logic
    # @param to [String] Recipient email address
    # @param template [String] Template name (otp_code, welcome, admin_notification)
    # @param variables [Hash] Template variables
    # @return [String] Resend message ID
    # @raise [EmailDeliveryError] if delivery fails after retries
    def self.send_email(to:, template:, variables: {})
      validate_email!(to)

      email_data = build_email_data(to: to, template: template, variables: variables)

      attempt = 0
      last_error = nil

      while attempt < MAX_RETRIES
        begin
          response = send_request(email_data)
          message_id = parse_response(response)

          # Log successful delivery
          Rails.logger.info("Email sent successfully via Resend: #{message_id} to #{to}")

          return message_id
        rescue EmailDeliveryError, RateLimitError => e
          last_error = e
          attempt += 1

          if attempt < MAX_RETRIES
            delay = calculate_backoff_delay(attempt)
            Rails.logger.warn("Email delivery failed (attempt #{attempt}/#{MAX_RETRIES}): #{e.message}. Retrying in #{delay}s...")
            sleep(delay)
          end
        end
      end

      # All retries exhausted
      Rails.logger.error("Email delivery failed after #{MAX_RETRIES} attempts: #{last_error.message}")
      raise EmailDeliveryError, "Failed to send email after #{MAX_RETRIES} attempts: #{last_error.message}"
    end

    # Build email data based on template
    # @param to [String] Recipient email
    # @param template [String] Template name
    # @param variables [Hash] Template variables
    # @return [Hash] Email data for Resend API
    def self.build_email_data(to:, template:, variables:)
      case template
      when "otp_code"
        build_otp_email(to: to, variables: variables)
      when "welcome"
        build_welcome_email(to: to, variables: variables)
      when "admin_notification"
        build_admin_notification_email(to: to, variables: variables)
      else
        raise ArgumentError, "Unknown template: #{template}"
      end
    end

    # Build OTP code email
    def self.build_otp_email(to:, variables:)
      code = variables[:code]
      expires_in_minutes = variables[:expires_in_minutes] || 10

      {
        from: "Up Time Consulting <noreply@uptimeconsulting.co.za>",
        to: [ to ],
        subject: "Your Login Code for Up Time Consulting",
        html: render_otp_template(code: code, expires_in_minutes: expires_in_minutes),
        text: render_otp_text(code: code, expires_in_minutes: expires_in_minutes)
      }
    end

    # Build welcome email
    def self.build_welcome_email(to:, variables:)
      consultant_name = variables[:consultant_name] || "there"
      portal_url = variables[:portal_url] || ENV.fetch("PORTAL_URL", "https://portal.uptimeconsulting.co.za")

      {
        from: "Up Time Consulting <welcome@uptimeconsulting.co.za>",
        to: [ to ],
        subject: "Welcome to Up Time Consulting!",
        html: render_welcome_template(consultant_name: consultant_name, portal_url: portal_url),
        text: render_welcome_text(consultant_name: consultant_name, portal_url: portal_url)
      }
    end

    # Build admin notification email
    def self.build_admin_notification_email(to:, variables:)
      subject = variables[:subject] || "System Notification"
      message = variables[:message] || ""
      priority = variables[:priority] || "medium"
      details = variables[:details] || {}

      {
        from: "Up Time Consulting System <system@uptimeconsulting.co.za>",
        to: Array(to),
        subject: "[#{priority.upcase}] #{subject}",
        html: render_admin_notification_template(subject: subject, message: message, details: details, priority: priority),
        text: render_admin_notification_text(subject: subject, message: message, details: details, priority: priority)
      }
    end

    # Send HTTP request to Resend API
    def self.send_request(email_data)
      uri = URI(RESEND_API_URL)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 10
      http.open_timeout = 5

      request = Net::HTTP::Post.new(uri.path)
      request["Authorization"] = "Bearer #{resend_api_key}"
      request["Content-Type"] = "application/json"
      request.body = email_data.to_json

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        handle_error_response(response)
      end

      response
    end

    # Parse Resend API response
    def self.parse_response(response)
      data = JSON.parse(response.body)
      data["id"] || raise(EmailDeliveryError, "No message ID in response")
    rescue JSON::ParserError => e
      raise EmailDeliveryError, "Invalid JSON response: #{e.message}"
    end

    # Handle error responses from Resend API
    def self.handle_error_response(response)
      error_data = JSON.parse(response.body) rescue {}
      error_message = error_data["message"] || response.message

      case response.code.to_i
      when 429
        raise RateLimitError, "Rate limit exceeded: #{error_message}"
      when 400
        raise InvalidEmailError, "Invalid email data: #{error_message}"
      when 401
        raise EmailDeliveryError, "Authentication failed: #{error_message}"
      else
        raise EmailDeliveryError, "Email delivery failed (#{response.code}): #{error_message}"
      end
    end

    # Calculate exponential backoff delay
    def self.calculate_backoff_delay(attempt)
      BASE_DELAY * (2 ** attempt)
    end

    # Validate email address format
    def self.validate_email!(email)
      unless email =~ URI::MailTo::EMAIL_REGEXP
        raise InvalidEmailError, "Invalid email address: #{email}"
      end
    end

    # Get Resend API key from environment
    def self.resend_api_key
      ENV.fetch("RESEND_API_KEY") do
        raise EmailDeliveryError, "RESEND_API_KEY environment variable not set"
      end
    end

    # Template rendering methods

    def self.render_otp_template(code:, expires_in_minutes:)
      <<~HTML
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Login Code</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .code-box { background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
            .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace; }
            .expires { color: #666; font-size: 14px; margin-top: 15px; }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Up Time Consulting</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Consultant Gateway</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Your Login Code</h2>
              <p>Use the code below to complete your login to the Up Time Consulting portal:</p>
        #{'      '}
              <div class="code-box">
                <div class="code">#{code}</div>
                <div class="expires">Expires in #{expires_in_minutes} minutes</div>
              </div>
        #{'      '}
              <div class="warning">
                <strong>Security Notice:</strong> Never share this code with anyone. Up Time Consulting will never ask for your code via phone or email.
              </div>
        #{'      '}
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you didn't request this code, please ignore this email. The code will expire automatically.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">© #{Time.current.year} Up Time Consulting. All rights reserved.</p>
              <p style="margin: 10px 0 0 0;">Change Management Consulting Excellence</p>
            </div>
          </div>
        </body>
        </html>
      HTML
    end

    def self.render_otp_text(code:, expires_in_minutes:)
      <<~TEXT
        UP TIME CONSULTING - CONSULTANT GATEWAY

        Your Login Code: #{code}

        This code expires in #{expires_in_minutes} minutes.

        Enter this code on the login page to access your consultant portal.

        SECURITY NOTICE: Never share this code with anyone. Up Time Consulting will never ask for your code via phone or email.

        If you didn't request this code, please ignore this email.

        © #{Time.current.year} Up Time Consulting
      TEXT
    end

    def self.render_welcome_template(consultant_name:, portal_url:)
      <<~HTML
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Up Time Consulting</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #5568d3; }
            .checklist { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .checklist-item { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .checklist-item:last-child { border-bottom: none; }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to the Team! 🎉</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Up Time Consulting</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hi #{consultant_name},</h2>
              <p>Congratulations on completing your onboarding! We're thrilled to have you join the Up Time Consulting team.</p>
        #{'      '}
              <p>Your consultant portal is now active and ready to use. Here's what you can do:</p>
        #{'      '}
              <div class="checklist">
                <div class="checklist-item">✓ Update your profile and skills</div>
                <div class="checklist-item">✓ Upload your CV for automatic skill extraction</div>
                <div class="checklist-item">✓ View your project assignments</div>
                <div class="checklist-item">✓ Manage your availability status</div>
                <div class="checklist-item">✓ Update your banking details</div>
              </div>
        #{'      '}
              <div style="text-align: center; margin: 30px 0;">
                <a href="#{portal_url}" class="button">Access Your Portal</a>
              </div>
        #{'      '}
              <h3 style="color: #333; margin-top: 40px;">Next Steps</h3>
              <p>1. <strong>Complete your profile:</strong> Add your bio, skills, and experience</p>
              <p>2. <strong>Upload your CV:</strong> We'll automatically extract your skills</p>
              <p>3. <strong>Set your availability:</strong> Let us know when you're ready for projects</p>
        #{'      '}
              <p style="margin-top: 30px;">If you have any questions or need assistance, don't hesitate to reach out to our team.</p>
        #{'      '}
              <p style="margin-top: 30px;">Welcome aboard!</p>
              <p style="margin-top: 10px;"><strong>The Up Time Consulting Team</strong></p>
            </div>
            <div class="footer">
              <p style="margin: 0;">© #{Time.current.year} Up Time Consulting. All rights reserved.</p>
              <p style="margin: 10px 0 0 0;">Change Management Consulting Excellence</p>
            </div>
          </div>
        </body>
        </html>
      HTML
    end

    def self.render_welcome_text(consultant_name:, portal_url:)
      <<~TEXT
        UP TIME CONSULTING - WELCOME!

        Hi #{consultant_name},

        Congratulations on completing your onboarding! We're thrilled to have you join the Up Time Consulting team.

        Your consultant portal is now active and ready to use.

        WHAT YOU CAN DO:
        - Update your profile and skills
        - Upload your CV for automatic skill extraction
        - View your project assignments
        - Manage your availability status
        - Update your banking details

        ACCESS YOUR PORTAL:
        #{portal_url}

        NEXT STEPS:
        1. Complete your profile: Add your bio, skills, and experience
        2. Upload your CV: We'll automatically extract your skills
        3. Set your availability: Let us know when you're ready for projects

        If you have any questions or need assistance, don't hesitate to reach out to our team.

        Welcome aboard!
        The Up Time Consulting Team

        © #{Time.current.year} Up Time Consulting
      TEXT
    end

    def self.render_admin_notification_template(subject:, message:, details:, priority:)
      priority_colors = {
        "critical" => "#dc3545",
        "high" => "#fd7e14",
        "medium" => "#ffc107",
        "low" => "#28a745"
      }
      color = priority_colors[priority.downcase] || "#6c757d"

      <<~HTML
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>System Notification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: #{color}; color: white; padding: 30px 20px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .priority-badge { display: inline-block; background: rgba(255,255,255,0.3); padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 10px; }
            .content { padding: 30px; }
            .message-box { background: #f8f9fa; border-left: 4px solid #{color}; padding: 20px; margin: 20px 0; }
            .details { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin: 20px 0; }
            .details-title { font-weight: 600; color: #333; margin-bottom: 10px; }
            .details-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-family: 'Courier New', monospace; font-size: 13px; }
            .details-item:last-child { border-bottom: none; }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>System Notification</h1>
              <span class="priority-badge">#{priority.upcase} Priority</span>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">#{subject}</h2>
        #{'      '}
              <div class="message-box">
                #{message}
              </div>
        #{'      '}
              #{render_details_section(details) if details.any?}
        #{'      '}
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Timestamp:</strong> #{Time.current.strftime("%Y-%m-%d %H:%M:%S %Z")}
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">Up Time Consulting - Consultant Gateway System</p>
              <p style="margin: 10px 0 0 0;">Automated System Notification</p>
            </div>
          </div>
        </body>
        </html>
      HTML
    end

    def self.render_details_section(details)
      return "" if details.empty?

      items = details.map do |key, value|
        "<div class=\"details-item\"><strong>#{key}:</strong> #{value}</div>"
      end.join("\n")

      <<~HTML
        <div class="details">
          <div class="details-title">Details:</div>
          #{items}
        </div>
      HTML
    end

    def self.render_admin_notification_text(subject:, message:, details:, priority:)
      details_text = if details.any?
        "\n\nDETAILS:\n" + details.map { |k, v| "#{k}: #{v}" }.join("\n")
      else
        ""
      end

      <<~TEXT
        UP TIME CONSULTING - SYSTEM NOTIFICATION

        PRIORITY: #{priority.upcase}

        #{subject}

        #{message}
        #{details_text}

        Timestamp: #{Time.current.strftime("%Y-%m-%d %H:%M:%S %Z")}

        ---
        This is an automated notification from the Consultant Gateway System.
      TEXT
    end
  end
end
