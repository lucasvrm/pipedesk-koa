-- ═══════════════════════════════════════════════════════════════
-- Migration: Create Branding Storage Bucket
-- Description: Create public bucket for brand assets (logo and favicon)
-- Author: System
-- Date: 2025-12-27
-- ═══════════════════════════════════════════════════════════════

-- Create branding bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for storage.objects (branding bucket)
-- ═══════════════════════════════════════════════════════════════

-- Policy: Allow SELECT for authenticated users (view brand assets)
CREATE POLICY "Allow authenticated users to view branding assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'branding');

-- Policy: Allow public SELECT (since bucket is public)
CREATE POLICY "Allow public to view branding assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branding');

-- Policy: Allow INSERT for admin and analyst roles
CREATE POLICY "Allow admin and analyst to upload branding assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'analyst')
  )
);

-- Policy: Allow UPDATE for admin and analyst roles
CREATE POLICY "Allow admin and analyst to update branding assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'analyst')
  )
)
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'analyst')
  )
);

-- Policy: Allow DELETE for admin and analyst roles
CREATE POLICY "Allow admin and analyst to delete branding assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'analyst')
  )
);

-- ═══════════════════════════════════════════════════════════════
-- Notes:
-- - The branding bucket is marked as public for easy access
-- - Files are limited to 2MB
-- - Supported formats: PNG, JPG, JPEG, SVG, ICO
-- - Only admin and analyst users can upload/modify/delete
-- - All authenticated users can view (bucket is public anyway)
-- ═══════════════════════════════════════════════════════════════
