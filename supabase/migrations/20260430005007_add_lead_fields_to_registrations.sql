/*
  # Add extended lead capture fields to registrations

  1. Changes to `registrations` table
    - Add `pilot_status` (text) — e.g. "Student Pilot", "Private Pilot", "Non-Pilot"
    - Add `interested_in` (text) — e.g. "Builder Assist Program", "Rudder Workshop", "Both"
    - Add `desired_build_month` (text) — e.g. "September 2026", "October 2026"
    - Rename `registration_type` values to support 'builder_list' and 'workshop' (column already exists, no type change needed)

  2. Notes
    - All new columns are nullable to preserve existing rows
    - No destructive changes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'pilot_status'
  ) THEN
    ALTER TABLE registrations ADD COLUMN pilot_status text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'interested_in'
  ) THEN
    ALTER TABLE registrations ADD COLUMN interested_in text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'desired_build_month'
  ) THEN
    ALTER TABLE registrations ADD COLUMN desired_build_month text DEFAULT '';
  END IF;
END $$;
