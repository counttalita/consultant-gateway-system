# Feature: consultant-gateway-system, Property 5: Profile Update Validation
# Validates: Requirements 2.1
#
# Property: For any valid profile update with valid bio, skills, or banking details,
# the system should accept the update and pass validation.

require "rails_helper"

RSpec.describe "Consultant Profile Update Validation Property", type: :model do
  describe "Property 5: Profile Update Validation" do
    it "accepts any valid profile update with valid bio, skills, or banking details" do
      property_test(iterations: 100) do
        # Generate valid profile attributes
        bio = Rantly { sized(range(0, 1000)) { string } }
        skills = Rantly { array(range(1, 10)) { string(:alpha) } }
        banking_details = {
          "bank_name" => Rantly { choose("FNB", "Standard Bank", "ABSA", "Nedbank", "Capitec") },
          "account_number" => Rantly { sized(10) { string(:digit) } },
          "branch_code" => Rantly { sized(6) { string(:digit) } },
          "account_type" => Rantly { choose("Savings", "Cheque", "Current") }
        }

        attributes = {
          bio: bio,
          skills: skills,
          banking_details: banking_details
        }

        # Create a consultant with a user
        user = User.create!(
          email: "consultant#{SecureRandom.hex(8)}@example.com",
          roles: [ "consultant" ],
          active: true
        )
        consultant = Consultant.create!(
          user: user,
          availability_status: "available",
          onboarding_status: "pending"
        )

        # Update the consultant with generated attributes
        result = consultant.update(attributes)

        # The update should succeed
        expect(result).to be(true), "Expected update to succeed but got errors: #{consultant.errors.full_messages.join(', ')}"
        expect(consultant.errors).to be_empty, "Expected no validation errors but got: #{consultant.errors.full_messages.join(', ')}"

        # Verify the attributes were saved
        consultant.reload
        expect(consultant.bio).to eq(attributes[:bio]) if attributes[:bio].present?
        expect(consultant.skills).to match_array(attributes[:skills]) if attributes[:skills].present?
        expect(consultant.banking_details).to eq(attributes[:banking_details]) if attributes[:banking_details].present?
      end
    end
  end
end
