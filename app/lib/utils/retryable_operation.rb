module Utils
  class RetryableOperation
    def self.execute(max_retries: 3, base_delay: 1, on_error: nil)
      retries = 0
      begin
        yield
      rescue StandardError => e
        if retries < max_retries
          retries += 1
          delay = base_delay * (2**(retries - 1))

          if on_error
            on_error.call(e, retries, delay)
          else
            Rails.logger.warn("Operation failed: #{e.message}. Retrying in #{delay}s (Attempt #{retries}/#{max_retries})")
          end

          sleep(delay)
          retry
        else
          raise e
        end
      end
    end
  end
end
