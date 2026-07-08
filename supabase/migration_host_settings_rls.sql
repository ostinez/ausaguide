-- Migration: Fix host settings update RLS policy
--
-- This policy ensures authenticated hosts can update their own settings
-- based on their authenticated user ID (which matches the host_id column).

DROP POLICY IF EXISTS "Hosts can update their own settings" ON public.host_settings;

CREATE POLICY "Hosts can update their own settings"
ON public.host_settings
FOR UPDATE
USING (auth.uid() = host_id);

-- Ensure anon role permissions are maintained for local storage mode if needed
GRANT SELECT, INSERT, UPDATE ON public.host_settings TO anon, authenticated;
