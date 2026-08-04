
CREATE POLICY "resume upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "resume read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "resume read by requested alumni" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND EXISTS (
      SELECT 1 FROM public.referral_requests r
      WHERE r.alumni_id = auth.uid()
        AND r.resume_url = storage.objects.name
    )
  );
CREATE POLICY "resume delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
