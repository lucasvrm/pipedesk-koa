-- ═══════════════════════════════════════════════════════════════
-- Migration: Update Branding Storage Policies - Add Manager Role
-- Description: Include 'manager' role in CRUD policies for branding bucket
-- Author: System
-- Date: 2025-12-27
-- ═══════════════════════════════════════════════════════════════

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Allow admin and analyst to upload branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin and analyst to update branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin and analyst to delete branding assets" ON storage.objects;

-- ═══════════════════════════════════════════════════════════════
-- Recreate policies with manager role included
-- ═══════════════════════════════════════════════════════════════

-- Policy: Allow INSERT for admin, manager, and analyst roles
CREATE POLICY "Allow admin, manager and analyst to upload branding assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager', 'analyst')
  )
);

-- Policy: Allow UPDATE for admin, manager, and analyst roles
CREATE POLICY "Allow admin, manager and analyst to update branding assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager', 'analyst')
  )
)
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager', 'analyst')
  )
);

-- Policy: Allow DELETE for admin, manager, and analyst roles
CREATE POLICY "Allow admin, manager and analyst to delete branding assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager', 'analyst')
  )
);

-- ═══════════════════════════════════════════════════════════════
-- Notes:
-- - SELECT policies remain unchanged (public bucket)
-- - Manager role now has full CRUD access to branding assets
-- - Aligns with route permissions (/admin/settings/customize)
-- ═══════════════════════════════════════════════════════════════
