/*
  # CRM: Schedule and Clients Tables

  1. New Tables
    - `crm_clients`
      - Tracks build program clients / students
      - id, name, email, phone, city, state
      - program_type (Rudder Workshop, Full Build, etc.)
      - status (Prospect, Registered, Active, Completed, Cancelled)
      - pilot_status, notes, created_at, updated_at

    - `crm_schedule`
      - Build session / appointment calendar entries
      - id, title, description, start_date, end_date
      - session_type (Build Session, Rudder Workshop, Consultation, Orientation, Other)
      - client_id (FK → crm_clients, nullable)
      - instructor / lead staff name
      - max_capacity, enrolled_count
      - status (Scheduled, Confirmed, In Progress, Completed, Cancelled)
      - notes, created_at, updated_at

  2. Security
    - RLS enabled, anon can read/write (internal app protected by app-level auth)
*/

-- ─── crm_clients ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL DEFAULT '',
  email        text NOT NULL DEFAULT '',
  phone        text NOT NULL DEFAULT '',
  city         text NOT NULL DEFAULT '',
  state        text NOT NULL DEFAULT '',
  program_type text NOT NULL DEFAULT 'Rudder Workshop',
  status       text NOT NULL DEFAULT 'Prospect',
  pilot_status text NOT NULL DEFAULT '',
  notes        text NOT NULL DEFAULT '',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select crm_clients"
  ON crm_clients FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert crm_clients"
  ON crm_clients FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update crm_clients"
  ON crm_clients FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete crm_clients"
  ON crm_clients FOR DELETE TO anon USING (true);

-- ─── crm_schedule ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_schedule (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL DEFAULT '',
  description     text NOT NULL DEFAULT '',
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  session_type    text NOT NULL DEFAULT 'Build Session',
  client_id       uuid REFERENCES crm_clients(id) ON DELETE SET NULL,
  client_name     text NOT NULL DEFAULT '',
  instructor      text NOT NULL DEFAULT '',
  max_capacity    integer NOT NULL DEFAULT 1,
  enrolled_count  integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'Scheduled',
  notes           text NOT NULL DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE crm_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select crm_schedule"
  ON crm_schedule FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert crm_schedule"
  ON crm_schedule FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update crm_schedule"
  ON crm_schedule FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete crm_schedule"
  ON crm_schedule FOR DELETE TO anon USING (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_crm_schedule_start ON crm_schedule (start_date);
CREATE INDEX IF NOT EXISTS idx_crm_clients_status ON crm_clients (status);
