# frozen_string_literal: true

module Utils
  class CircuitBreaker
    class OpenCircuitError < StandardError; end

    attr_reader :state, :failure_count, :last_failure_time, :name

    def initialize(name = nil, failure_threshold: 5, reset_timeout: 60)
      @name = name
      @failure_threshold = failure_threshold
      @reset_timeout = reset_timeout
      @failure_count = 0
      @state = :closed # :closed, :open, :half_open
      @last_failure_time = nil
    end

    def execute
      check_state

      if @state == :open
        raise OpenCircuitError, "Circuit is open due to failures"
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

    # Alias for execute to support both calling conventions
    alias call execute

    private

    def check_state
      if @state == :open && (Time.now - @last_failure_time) > @reset_timeout
        @state = :half_open
      end
    end

    def success
      if @state == :half_open
        reset
      else
        @failure_count = 0
      end
    end

    def failure
      @failure_count += 1
      @last_failure_time = Time.now

      if @state == :half_open || @failure_count >= @failure_threshold
        open
      end
    end

    def open
      @state = :open
      name_prefix = @name ? "#{@name} " : ""
      Rails.logger.warn("#{name_prefix}Circuit breaker opened after #{@failure_count} failures")
    end

    def reset
      @state = :closed
      @failure_count = 0
      @last_failure_time = nil
      name_prefix = @name ? "#{@name} " : ""
      Rails.logger.info("#{name_prefix}Circuit breaker reset to closed state")
    end
  end
end
