class ApplicationController < ActionController::API
  include Authorizable

  before_action :set_correlation_id
  after_action :add_correlation_id_header

  rescue_from StandardError do |e|
    ErrorHandler.handle(e, context: {
      controller: controller_name,
      action: action_name,
      params: params.to_unsafe_h
    }, severity: :high)

    render json: { error: "Internal Server Error", reference: RequestStore.store[:correlation_id] }, status: :internal_server_error
  end

  private

  def set_correlation_id
    correlation_id = request.headers["X-Correlation-ID"] || SecureRandom.uuid
    RequestStore.store[:correlation_id] = correlation_id
  end

  def add_correlation_id_header
    response.set_header("X-Correlation-ID", RequestStore.store[:correlation_id])
  end

  def authenticate_user!
    token = request.headers["Authorization"]&.gsub(/^Bearer /, "")

    if token.blank?
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    auth_service = AuthenticationService.new
    user = auth_service.validate_session(token: token, ip_address: request.remote_ip)

    if user
      @current_user = user
    else
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end
end
