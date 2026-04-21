-- Migration: Ad Expiration System
-- Description: Adds 'expired' status, notifications table, and performance indexes.

-- 1. AD_STATUS ENUM UPDATE (Safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'ad_status' AND e.enumlabel = 'expired') THEN
        ALTER TYPE public.ad_status ADD VALUE 'expired';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If type doesn't exist at all, we let the main schema handle it or create it if needed
        CREATE TYPE public.ad_status AS ENUM ('pending', 'active', 'rejected', 'sold', 'paused', 'expired');
END $$;

-- 2. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'expiration_warning', 'chat', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    image TEXT,
    unread BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    
    -- Constraint to prevent duplicate expiration warnings for the same ad
    CONSTRAINT unique_expiration_warning UNIQUE (user_id, ad_id, type)
);

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON public.ads (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications (user_id, unread);

-- 4. AD AUDIT LOGS (Simple table for the edge function logs)
CREATE TABLE IF NOT EXISTS public.ad_cleanup_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_id UUID,
    event TEXT NOT NULL, -- 'storage_deleted', 'record_deleted', 'error'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);
