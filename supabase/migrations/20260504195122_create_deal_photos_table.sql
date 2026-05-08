/*
  # Deal Photos Table

  1. New Tables
    - `crm_deal_photos`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK → crm_projects, cascade delete)
      - `storage_path` (text) — path inside the Supabase storage bucket
      - `filename` (text) — original filename for display
      - `created_at` (timestamp)

  2. Storage
    - Public bucket `deal-photos` is created via the app on first use
    - Photos are stored at `{project_id}/{uuid}.{ext}`

  3. Security
    - RLS enabled, anon can read/write (internal app, app-level auth)
*/

CREATE TABLE IF NOT EXISTS crm_deal_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES crm_projects(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  filename     text NOT NULL DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE crm_deal_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select crm_deal_photos"
  ON crm_deal_photos FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert crm_deal_photos"
  ON crm_deal_photos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can delete crm_deal_photos"
  ON crm_deal_photos FOR DELETE TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_crm_deal_photos_project ON crm_deal_photos (project_id);
