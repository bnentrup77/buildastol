/*
  # Add project_cost to crm_projects and create pricing_config table

  1. Changes to crm_projects
    - `project_cost` (numeric) — calculated total cost from evaluator
    - `profit_potential` (numeric) — calculated profit (sell price - project cost)
    - `profit_pct` (numeric) — profit as a percentage of project cost

  2. New Tables
    - `pricing_config` — stores editable pricing for each cost component
      - `id` (uuid, primary key)
      - `aircraft_type` (text) — e.g. 'CH750 STOL'
      - `component` (text) — component key
      - `label` (text) — display label
      - `default_cost` (numeric) — editable current cost
      - `updated_at` (timestamptz)

  3. Seed default pricing for CH750 STOL

  4. Security
    - RLS enabled on pricing_config
    - Anon can read/write (internal admin tool)
*/

-- Add columns to crm_projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_projects' AND column_name='project_cost') THEN
    ALTER TABLE crm_projects ADD COLUMN project_cost numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_projects' AND column_name='profit_potential') THEN
    ALTER TABLE crm_projects ADD COLUMN profit_potential numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_projects' AND column_name='profit_pct') THEN
    ALTER TABLE crm_projects ADD COLUMN profit_pct numeric DEFAULT 0;
  END IF;
END $$;

-- Pricing config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_type text NOT NULL DEFAULT 'CH750 STOL',
  component    text NOT NULL,
  label        text NOT NULL,
  default_cost numeric NOT NULL DEFAULT 0,
  sort_order   int NOT NULL DEFAULT 0,
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(aircraft_type, component)
);

ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select pricing_config"
  ON pricing_config FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert pricing_config"
  ON pricing_config FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update pricing_config"
  ON pricing_config FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Seed default CH750 STOL pricing
INSERT INTO pricing_config (aircraft_type, component, label, default_cost, sort_order) VALUES
  ('CH750 STOL', 'airframe',        'Airframe Package',    28250, 1),
  ('CH750 STOL', 'wings',           'Wings',                9850, 2),
  ('CH750 STOL', 'firewall_fwd',    'Firewall Forward',     9000, 3),
  ('CH750 STOL', 'engine_rotax',    'Engine — Rotax',      25000, 4),
  ('CH750 STOL', 'engine_ulpower',  'Engine — ULPower',    34000, 5),
  ('CH750 STOL', 'ap_labor',        'A&P Labor',               0, 6),
  ('CH750 STOL', 'shop_labor',      'Shop Labor',              0, 7),
  ('CH750 STOL', 'freight',         'Freight',                 0, 8),
  ('CH750 STOL', 'misc',            'Misc / Other',            0, 9)
ON CONFLICT (aircraft_type, component) DO NOTHING;
