-- ─────────────────────────────────────────────────────────────────────────────
-- Storage Bucket Policies
-- Run after creating buckets in Supabase Dashboard → Storage
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── charity-images bucket ────────────────────────────────────────────────────
-- Public read (anyone can view charity images)
INSERT INTO storage.policies (id, name, bucket_id, operation, definition)
VALUES (
  gen_random_uuid(),
  'charity-images-public-read',
  'charity-images',
  'SELECT',
  'true'
) ON CONFLICT DO NOTHING;

-- Only service role (admin via API) can upload — enforced at app layer
-- No INSERT policy needed as uploads go through service role

-- ─── winner-proofs bucket ─────────────────────────────────────────────────────
-- Authenticated users can upload to their own prefix
CREATE POLICY "winner-proofs-user-upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'winner-proofs' AND
    auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- Authenticated users can read their own proofs
CREATE POLICY "winner-proofs-user-read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'winner-proofs' AND
    auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- Public read for admin review (admin uses service role which bypasses RLS)
-- Alternatively create an admin-read policy:
-- CREATE POLICY "winner-proofs-admin-read" ...

-- ─── NOTE ─────────────────────────────────────────────────────────────────────
-- These policies can also be set via the Supabase Dashboard under
-- Storage → Policies. The dashboard UI is often easier for bucket policies.
-- The above SQL is provided for automation / reference.
