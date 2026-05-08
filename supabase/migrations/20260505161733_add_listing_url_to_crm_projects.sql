/*
  # Add listing_url to crm_projects

  1. Changes
    - Adds `listing_url` (text) column to `crm_projects` for storing the original listing link
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_projects' AND column_name = 'listing_url'
  ) THEN
    ALTER TABLE crm_projects ADD COLUMN listing_url text DEFAULT '';
  END IF;
END $$;
