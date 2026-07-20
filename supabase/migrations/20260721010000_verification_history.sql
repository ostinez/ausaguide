-- Migration: Create verification_history table for auditing host certifications

CREATE TABLE IF NOT EXISTS public.verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'revoked'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- Add policies
-- 1. Admins can manage verification history (read/insert)
CREATE POLICY "Admins can manage verification history"
    ON public.verification_history
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Hosts can read their own verification history
CREATE POLICY "Hosts can read their own verification history"
    ON public.verification_history
    FOR SELECT
    TO authenticated
    USING (
        host_id = auth.uid()
    );
