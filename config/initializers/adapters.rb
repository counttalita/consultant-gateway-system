# frozen_string_literal: true

# Load adapters from lib/adapters
Rails.application.config.to_prepare do
  Dir[Rails.root.join("lib", "adapters", "*.rb")].each { |file| require file }
end
