/*
  # Storage RLS policies for deal-photos bucket

  Allows anon users (internal app) to upload, read, and delete objects
  in the deal-photos storage bucket.
*/

CREATE POLICY "Anon can upload deal photos"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'deal-photos');

CREATE POLICY "Anon can read deal photos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'deal-photos');

CREATE POLICY "Anon can delete deal photos"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'deal-photos');
