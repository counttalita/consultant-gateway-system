# Property-based testing helpers
require 'rantly'

module PropertyTestHelpers
  # Default number of iterations for property tests
  PROPERTY_TEST_ITERATIONS = 100

  # Helper to run property tests with specified iterations
  def property_test(iterations: PROPERTY_TEST_ITERATIONS, &block)
    iterations.times do
      yield
    end
  end

  # Helper to generate random data using Rantly
  def property_of(&generator)
    Rantly.new.tap do |r|
      r.instance_eval(&generator)
    end
  end
end

RSpec.configure do |config|
  config.include PropertyTestHelpers
end
