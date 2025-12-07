require 'rails_helper'

RSpec.describe "Property-Based Testing Setup" do
  it "can generate random strings" do
    property_test(iterations: 10) do
      random_string = Rantly { string }
      expect(random_string).to be_a(String)
    end
  end

  it "can generate random integers" do
    property_test(iterations: 10) do
      random_int = Rantly { integer }
      expect(random_int).to be_a(Integer)
    end
  end

  it "verifies string concatenation is associative" do
    property_test(iterations: 10) do
      a = Rantly { string }
      b = Rantly { string }
      c = Rantly { string }

      # (a + b) + c should equal a + (b + c)
      expect((a + b) + c).to eq(a + (b + c))
    end
  end
end
