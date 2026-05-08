/*
  # Fix RLS policies for aircraft_types and pricing_config

  The CRM uses custom username/password auth (not Supabase Auth), so auth.uid()
  is always null. This migration aligns aircraft_types policies with the existing
  anon-accessible pattern already used by pricing_config, and fixes the
  pricing_config DELETE policy to also allow anon.

  Changes:
  - Drop auth.uid()-gated policies on aircraft_types, replace with anon-open policies
  - Drop auth.uid()-gated DELETE policy on pricing_config, add anon DELETE policy
*/

-- aircraft_types: drop old auth.uid() policies
DROP POLICY IF EXISTS "Authenticated users can read aircraft types" ON aircraft_types;
DROP POLICY IF EXISTS "Authenticated users can insert aircraft types" ON aircraft_types;
DROP POLICY IF EXISTS "Authenticated users can update aircraft types" ON aircraft_types;
DROP POLICY IF EXISTS "Authenticated users can delete aircraft types" ON aircraft_types;

-- aircraft_types: open policies matching pricing_config pattern
CREATE POLICY "Anon can select aircraft_types"
  ON aircraft_types FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can insert aircraft_types"
  ON aircraft_types FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update aircraft_types"
  ON aircraft_types FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete aircraft_types"
  ON aircraft_types FOR DELETE
  TO anon, authenticated
  USING (true);

-- pricing_config: fix DELETE (was auth.uid()-gated, needs anon)
DROP POLICY IF EXISTS "Authenticated users can delete pricing config" ON pricing_config;

CREATE POLICY "Anon can delete pricing_config"
  ON pricing_config FOR DELETE
  TO anon, authenticated
  USING (true);
