require 'rails_helper'

RSpec.describe OnboardingStep, type: :model do
  describe "validations" do
    subject { build(:onboarding_step) }

    it { should validate_presence_of(:step_name) }
    it { should validate_uniqueness_of(:step_name).scoped_to(:consultant_id) }
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:status).in_array(%w[pending in_progress completed]) }
    it { should validate_inclusion_of(:step_name).in_array(%w[personal_info banking skills contract welcome]) }
  end

  describe "scopes" do
    let!(:pending_step) { create(:onboarding_step, status: "pending", step_name: "personal_info") }
    let!(:in_progress_step) { create(:onboarding_step, status: "in_progress", step_name: "banking") }
    let!(:completed_step) { create(:onboarding_step, status: "completed", step_name: "skills") }

    it "returns pending steps" do
      expect(OnboardingStep.pending).to include(pending_step)
      expect(OnboardingStep.pending).not_to include(in_progress_step)
      expect(OnboardingStep.pending).not_to include(completed_step)
    end

    it "returns in_progress steps" do
      expect(OnboardingStep.in_progress).to include(in_progress_step)
      expect(OnboardingStep.in_progress).not_to include(pending_step)
      expect(OnboardingStep.in_progress).not_to include(completed_step)
    end

    it "returns completed steps" do
      expect(OnboardingStep.completed).to include(completed_step)
      expect(OnboardingStep.completed).not_to include(pending_step)
      expect(OnboardingStep.completed).not_to include(in_progress_step)
    end
  end

  describe "state transitions" do
    let(:step) { create(:onboarding_step, status: "pending") }

    it "can start a pending step" do
      step.start!
      expect(step.status).to eq("in_progress")
    end

    it "can complete a step" do
      step.start!
      step.complete!({ some_data: "value" })

      expect(step.status).to eq("completed")
      expect(step.completed_at).to be_present
      expect(step.data["some_data"]).to eq("value")
    end
  end

  describe "navigation" do
    let(:consultant) { create(:consultant) }

    before do
      OnboardingStep.initialize_for_consultant(consultant)
    end

    it "knows the next step" do
      first_step = consultant.onboarding_steps.find_by(step_name: "personal_info")
      next_step = first_step.next_step

      expect(next_step).to be_present
      expect(next_step.step_name).to eq("banking")
    end

    it "knows the previous step" do
      second_step = consultant.onboarding_steps.find_by(step_name: "banking")
      prev_step = second_step.previous_step

      expect(prev_step).to be_present
      expect(prev_step.step_name).to eq("personal_info")
    end

    it "returns nil for previous step of first step" do
      first_step = consultant.onboarding_steps.find_by(step_name: "personal_info")
      expect(first_step.previous_step).to be_nil
    end

    it "returns nil for next step of last step" do
      last_step = consultant.onboarding_steps.find_by(step_name: "welcome")
      expect(last_step.next_step).to be_nil
    end
  end
end
