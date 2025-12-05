module Utils
  class CircuitBreaker
    class OpenCircuitError < StandardError; end

    attr_reader :state, :failure_count, :last_failure_time

    def initialize(service_name, failure_threshold: 5, reset_timeout: 60)
      @service_name = service_name
      @failure_threshold = failure_threshold
      @reset_timeout = reset_timeout
      @state = :closed
      @failure_count = 0
      @last_failure_time = nil
      @mutex = Mutex.new
    end

    def call
      @mutex.synchronize do
        check_state

        if @state == :open
          raise OpenCircuitError, "Circuit is open for #{@service_name}"
        end
      end

      begin
        result = yield
        success
        result
      rescue StandardError => e
        failure
        raise e
      end
    end

    private

    def check_state
      if @state == :open && (Time.current - @last_failure_time) > @reset_timeout
        @state = :half_open
        Rails.logger.info("Circuit breaker for #{@service_name} is now HALF-OPEN")
      end
    end

    def success
      @mutex.synchronize do
        if @state == :half_open
          reset
          Rails.logger.info("Circuit breaker for #{@service_name} is now CLOSED")
        end
      end
    end

    def failure
      @mutex.synchronize do
        @failure_count += 1
        @last_failure_time = Time.current

        if @failure_count >= @failure_threshold
          @state = :open
          Rails.logger.warn("Circuit breaker for #{@service_name} is now OPEN")
        end
      end
    end

    def reset
      @state = :closed
      @failure_count = 0
      @last_failure_time = nil
    end
  end
end
