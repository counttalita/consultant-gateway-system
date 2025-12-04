require 'rails_helper'

RSpec.describe "Health Check", type: :request do
  describe "GET /health" do
    it "returns a successful response" do
      get "/health"
      
      expect(response).to have_http_status(:success)
      
      json = JSON.parse(response.body)
      expect(json["status"]).to eq("ok")
      expect(json["environment"]).to eq("test")
    end
  end

  describe "GET /" do
    it "returns a successful response" do
      get "/"
      
      expect(response).to have_http_status(:success)
    end
  end
end
