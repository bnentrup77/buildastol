/*
  # Create registrations table for BUILDaSTOL program

  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `first_name` (text, required)
      - `last_name` (text, required)
      - `email` (text, unique, required)
      - `phone` (text, optional)
      - `registration_type` (text: 'pre_register' or 'waitlist')
      - `notes` (text, optional - any message from applicant)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `registrations` table
    - Public INSERT allowed (anyone can register)
    - No public SELECT (only service role can read)
*/

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text DEFAULT '',
  registration_type text NOT NULL DEFAULT 'pre_register',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT registrations_email_unique UNIQUE (email)
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a registration"
  ON registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (registration_type IN ('pre_register', 'waitlist'));
