/*
  # Fix registrations RLS policy to allow builder_list and workshop types

  The existing INSERT policy only permitted 'pre_register' and 'waitlist' values
  for registration_type, but the app sends 'builder_list' and 'workshop'.
  This migration drops the old policy and replaces it with one that allows all
  current valid values.
*/

DROP POLICY IF EXISTS "Anyone can submit a registration" ON registrations;

CREATE POLICY "Anyone can submit a registration"
  ON registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (registration_type IN ('pre_register', 'waitlist', 'builder_list', 'workshop'));
