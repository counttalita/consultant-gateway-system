# frozen_string_literal: true

module Utils
  class RetryableOperation
    class MaxRetriesExceededError < StandardError; end

    def initialize(max_retries: 3, base_delay: 1, exponential: true, on_error: nil)
      @max_retries = max_retries
      @base_delay = base_delay
      @exponential = exponential
      @on_error = on_error
    end

    # Class method for convenience
    def self.execute(max_retries: 3, base_delay: 1, exponential: true, on_error: nil, &block)
      new(max_retries: max_retries, base_delay: base_delay, exponential: exponential, on_error: on_error).execute(&block)
    end

    def execute
      retries = 0
      begin
        yield
      rescue StandardError => e
        if retries < @max_retries
          retries += 1
          delay = calculate_delay(retries)

          # Call the on_error callback if provided
          @on_error&.call(e, retries, delay)

          Rails.logger.warn("Operation failed: #{e.message}. Retrying in #{delay} seconds (Attempt #{retries}/#{@max_retries})")
          sleep(delay)
          retry
        else
          Rails.logger.error("Operation failed after #{@max_retries} retries: #{e.message}")
          raise MaxRetriesExceededError, "Operation failed after #{@max_retries} retries: #{e.message}"
        end
      end
    end

    private

    def calculate_delay(attempt)
      return @base_delay unless @exponential
      @base_delay * (2**(attempt - 1))
    end
  end
end
