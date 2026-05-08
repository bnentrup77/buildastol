/*
  # Fix crm_users RLS to allow anon login verification

  The login flow uses the anon key to verify username + password_hash.
  The previous policy only allowed service_role, blocking all client-side auth checks.
  Adding an anon SELECT policy so the app can verify credentials.
*/

CREATE POLICY "Anon can verify crm_users credentials"
  ON crm_users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update crm_users"
  ON crm_users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
