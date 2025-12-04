# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_04_081131) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "airtable_caches", force: :cascade do |t|
    t.datetime "cached_at", null: false
    t.datetime "created_at", null: false
    t.jsonb "data", default: {}
    t.string "record_id", null: false
    t.string "table", null: false
    t.datetime "updated_at", null: false
    t.index ["cached_at"], name: "index_airtable_caches_on_cached_at"
    t.index ["data"], name: "index_airtable_caches_on_data", using: :gin
    t.index ["table", "record_id"], name: "index_airtable_caches_on_table_and_record_id", unique: true
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.jsonb "change_data", default: {}
    t.datetime "created_at", null: false
    t.inet "ip_address"
    t.jsonb "metadata", default: {}
    t.integer "resource_id"
    t.string "resource_type"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["change_data"], name: "index_audit_logs_on_change_data", using: :gin
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["metadata"], name: "index_audit_logs_on_metadata", using: :gin
    t.index ["resource_type", "resource_id"], name: "index_audit_logs_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "consultants", force: :cascade do |t|
    t.string "airtable_id"
    t.string "availability_status", default: "available"
    t.jsonb "banking_details"
    t.text "bio"
    t.datetime "created_at", null: false
    t.string "harvest_id"
    t.string "onboarding_status", default: "pending"
    t.jsonb "skills", default: []
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.decimal "utilization_percentage", precision: 5, scale: 2, default: "0.0"
    t.string "xero_id"
    t.index ["airtable_id"], name: "index_consultants_on_airtable_id", unique: true, where: "(airtable_id IS NOT NULL)"
    t.index ["availability_status"], name: "index_consultants_on_availability_status"
    t.index ["harvest_id"], name: "index_consultants_on_harvest_id", unique: true, where: "(harvest_id IS NOT NULL)"
    t.index ["onboarding_status"], name: "index_consultants_on_onboarding_status"
    t.index ["skills"], name: "index_consultants_on_skills", using: :gin
    t.index ["user_id"], name: "index_consultants_on_user_id"
    t.index ["xero_id"], name: "index_consultants_on_xero_id", unique: true, where: "(xero_id IS NOT NULL)"
  end

  create_table "onboarding_steps", force: :cascade do |t|
    t.datetime "completed_at"
    t.bigint "consultant_id", null: false
    t.datetime "created_at", null: false
    t.jsonb "data", default: {}
    t.string "status", default: "pending", null: false
    t.string "step_name", null: false
    t.datetime "updated_at", null: false
    t.index ["completed_at"], name: "index_onboarding_steps_on_completed_at"
    t.index ["consultant_id", "step_name"], name: "index_onboarding_steps_on_consultant_id_and_step_name", unique: true
    t.index ["consultant_id"], name: "index_onboarding_steps_on_consultant_id"
    t.index ["status"], name: "index_onboarding_steps_on_status"
  end

  create_table "otp_codes", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "consumed_at"
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.inet "ip_address"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["consumed_at"], name: "index_otp_codes_on_consumed_at"
    t.index ["expires_at"], name: "index_otp_codes_on_expires_at"
    t.index ["user_id", "code"], name: "index_otp_codes_on_user_id_and_code"
    t.index ["user_id"], name: "index_otp_codes_on_user_id"
  end

  create_table "project_assignments", force: :cascade do |t|
    t.bigint "consultant_id", null: false
    t.datetime "created_at", null: false
    t.date "end_date"
    t.bigint "project_id", null: false
    t.string "role"
    t.date "start_date"
    t.datetime "updated_at", null: false
    t.index ["consultant_id"], name: "index_project_assignments_on_consultant_id"
    t.index ["end_date"], name: "index_project_assignments_on_end_date"
    t.index ["project_id", "consultant_id"], name: "index_project_assignments_on_project_id_and_consultant_id", unique: true
    t.index ["project_id"], name: "index_project_assignments_on_project_id"
    t.index ["start_date"], name: "index_project_assignments_on_start_date"
  end

  create_table "projects", force: :cascade do |t|
    t.string "airtable_deal_id"
    t.string "clickup_project_id"
    t.string "clickup_url"
    t.string "client_name", null: false
    t.datetime "created_at", null: false
    t.string "drive_folder_id"
    t.string "drive_url"
    t.date "end_date"
    t.string "name", null: false
    t.date "start_date"
    t.string "status", default: "setup", null: false
    t.datetime "updated_at", null: false
    t.index ["airtable_deal_id"], name: "index_projects_on_airtable_deal_id", unique: true, where: "(airtable_deal_id IS NOT NULL)"
    t.index ["clickup_project_id"], name: "index_projects_on_clickup_project_id", unique: true, where: "(clickup_project_id IS NOT NULL)"
    t.index ["client_name"], name: "index_projects_on_client_name"
    t.index ["end_date"], name: "index_projects_on_end_date"
    t.index ["start_date"], name: "index_projects_on_start_date"
    t.index ["status"], name: "index_projects_on_status"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.inet "ip_address"
    t.datetime "last_activity_at"
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["expires_at"], name: "index_sessions_on_expires_at"
    t.index ["last_activity_at"], name: "index_sessions_on_last_activity_at"
    t.index ["token"], name: "index_sessions_on_token", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "tenders", force: :cascade do |t|
    t.string "airtable_id"
    t.string "bid_decision", default: "pending"
    t.text "bid_rationale"
    t.decimal "bid_score", precision: 5, scale: 2
    t.datetime "created_at", null: false
    t.string "reference_number", null: false
    t.jsonb "required_capabilities", default: []
    t.string "source"
    t.datetime "submission_deadline"
    t.decimal "tender_value", precision: 15, scale: 2
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["airtable_id"], name: "index_tenders_on_airtable_id", unique: true, where: "(airtable_id IS NOT NULL)"
    t.index ["bid_decision"], name: "index_tenders_on_bid_decision"
    t.index ["reference_number"], name: "index_tenders_on_reference_number", unique: true
    t.index ["required_capabilities"], name: "index_tenders_on_required_capabilities", using: :gin
    t.index ["submission_deadline"], name: "index_tenders_on_submission_deadline"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.text "roles", default: "[]", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_users_on_active"
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "audit_logs", "users"
  add_foreign_key "consultants", "users"
  add_foreign_key "onboarding_steps", "consultants"
  add_foreign_key "otp_codes", "users"
  add_foreign_key "project_assignments", "consultants"
  add_foreign_key "project_assignments", "projects"
  add_foreign_key "sessions", "users"
end
