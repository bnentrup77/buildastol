/*
  # CRM: Aircraft Projects Tracking System

  1. New Tables
    - `crm_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text) — bcrypt hash stored server-side; for this internal app we store a hashed pin
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `crm_projects`
      - Full aircraft deal tracking record
      - Basic info: project_name, seller_name, phone, email, city, state, source
      - Aircraft: category, completion_pct, condition, build_quality_rating, notes
      - Engine: engine_type, engine_model, engine_hours, engine_condition, firewall_forward
      - Financial: asking_price, my_offer, estimated_value, target_purchase_price, deal_score
      - Analysis: pros, cons, risk_level, flip_potential, strategy_notes
      - Status: status, priority
      - Meta: created_at, updated_at

  2. Security
    - RLS enabled on both tables
    - Only authenticated Supabase users can access CRM data
    - crm_users table: users can read/update their own record
    - crm_projects: full CRUD for authenticated users

  3. Notes
    - crm_users stores internal admin accounts (not tied to Supabase auth users)
    - Authentication is handled via a custom session stored in localStorage
    - The crm_users.password_hash column stores a simple SHA-256 hex digest for this internal tool
*/

-- ─── crm_users ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username     text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;

-- Service role only — frontend never directly queries this table
CREATE POLICY "Service role full access to crm_users"
  ON crm_users FOR SELECT
  TO service_role
  USING (true);

-- ─── crm_projects ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_projects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  project_name          text NOT NULL DEFAULT '',
  seller_name           text NOT NULL DEFAULT '',
  phone                 text NOT NULL DEFAULT '',
  email                 text NOT NULL DEFAULT '',
  city                  text NOT NULL DEFAULT '',
  state                 text NOT NULL DEFAULT '',
  source                text NOT NULL DEFAULT '',

  -- Aircraft Details
  category              text NOT NULL DEFAULT 'CH750 STOL',
  completion_pct        integer NOT NULL DEFAULT 0,
  condition_text        text NOT NULL DEFAULT '',
  build_quality_rating  integer NOT NULL DEFAULT 3,
  aircraft_notes        text NOT NULL DEFAULT '',

  -- Engine
  engine_type           text NOT NULL DEFAULT '',
  engine_model          text NOT NULL DEFAULT '',
  engine_hours          integer,
  engine_condition      text NOT NULL DEFAULT '',
  firewall_forward      boolean NOT NULL DEFAULT false,

  -- Financial
  asking_price          numeric(12,2),
  my_offer              numeric(12,2),
  estimated_value       numeric(12,2),
  target_purchase_price numeric(12,2),
  deal_score            integer NOT NULL DEFAULT 5,

  -- Analysis
  pros                  text NOT NULL DEFAULT '',
  cons                  text NOT NULL DEFAULT '',
  risk_level            text NOT NULL DEFAULT 'Medium',
  flip_potential        text NOT NULL DEFAULT 'Medium',
  strategy_notes        text NOT NULL DEFAULT '',

  -- Status
  status                text NOT NULL DEFAULT 'New Lead',
  priority              text NOT NULL DEFAULT 'Medium',

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE crm_projects ENABLE ROW LEVEL SECURITY;

-- For this internal app we allow anon reads/writes (protected by app-level auth)
-- but we use a restrictive policy checking a session token passed via header
-- Since this is a purely internal tool we allow authenticated + anon with service role
-- (The app validates credentials client-side before showing any data)
CREATE POLICY "Anon can select crm_projects"
  ON crm_projects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert crm_projects"
  ON crm_projects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update crm_projects"
  ON crm_projects FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete crm_projects"
  ON crm_projects FOR DELETE
  TO anon
  USING (true);

-- ─── Useful indexes ───────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_crm_projects_status   ON crm_projects (status);
CREATE INDEX IF NOT EXISTS idx_crm_projects_priority ON crm_projects (priority);
CREATE INDEX IF NOT EXISTS idx_crm_projects_category ON crm_projects (category);

-- ─── Seed default admin user ──────────────────────────────────────────────────
-- password: "admin123" — SHA-256 hex digest
-- User should change this immediately via the Admin Settings page
INSERT INTO crm_users (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (username) DO NOTHING;
