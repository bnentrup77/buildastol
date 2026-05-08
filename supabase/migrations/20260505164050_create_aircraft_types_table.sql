/*
  # Create aircraft_types table

  1. New Tables
    - `aircraft_types`
      - `id` (uuid, primary key)
      - `name` (text, unique) — display name e.g. "CH750 STOL"
      - `sort_order` (int) — display ordering
      - `created_at` / `updated_at` (timestamptz)

  2. Seed
    - Inserts existing aircraft types already referenced in pricing_config

  3. Security
    - Enable RLS
    - Authenticated users can read and write (same pattern as pricing_config)

  4. Pricing config
    - Adds `insert`, `delete`, `update label/sort_order` capabilities (columns already exist)
*/

CREATE TABLE IF NOT EXISTS aircraft_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aircraft_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read aircraft types"
  ON aircraft_types FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert aircraft types"
  ON aircraft_types FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update aircraft types"
  ON aircraft_types FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete aircraft types"
  ON aircraft_types FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Seed from existing pricing_config data
INSERT INTO aircraft_types (name, sort_order)
SELECT DISTINCT aircraft_type, 0
FROM pricing_config
ON CONFLICT (name) DO NOTHING;

-- Allow full CRUD on pricing_config for authenticated users (policies may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pricing_config' AND policyname = 'Authenticated users can insert pricing config'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Authenticated users can insert pricing config"
        ON pricing_config FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL)
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pricing_config' AND policyname = 'Authenticated users can delete pricing config'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Authenticated users can delete pricing config"
        ON pricing_config FOR DELETE
        TO authenticated
        USING (auth.uid() IS NOT NULL)
    $pol$;
  END IF;
END $$;
