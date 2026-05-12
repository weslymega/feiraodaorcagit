-- Phase 1: Conservative Ad Expiration (Dry Run Only)
-- This migration sets up the infrastructure for ad expiration without performing any real updates.

-- 1. Ensure Enum 'expired' exists in public.ad_status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'ad_status' AND e.enumlabel = 'expired') THEN
        ALTER TYPE public.ad_status ADD VALUE 'expired';
    END IF;
END $$;

-- 2. Infrastructure for 'renewed_at'
-- This allows users to "renew" their ads in the future without changing updated_at/created_at
ALTER TABLE public.anuncios ADD COLUMN IF NOT EXISTS renewed_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Fix ad_cleanup_logs table (Safe additions)
-- These columns are required by the cleanup Edge Function and the new expiration logic
ALTER TABLE public.ad_cleanup_logs 
    ADD COLUMN IF NOT EXISTS owner_id UUID,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 4. Expiration Logic (Phase 1: Support for Dry Run and Coalesced Date)
CREATE OR REPLACE FUNCTION public.execute_ads_expiration_v1(p_dry_run BOOLEAN DEFAULT TRUE)
RETURNS VOID AS $$
DECLARE
    v_ad_record RECORD;
    v_count INTEGER := 0;
    v_interval INTERVAL := '30 days';
BEGIN
    -- PHASE 1: IDENTIFY CANDIDATES
    -- We use COALESCE to prioritize renewal date, then update date, then creation date.
    FOR v_ad_record IN 
        SELECT 
            id, 
            user_id, 
            titulo, 
            COALESCE(renewed_at, updated_at, created_at) as last_activity
        FROM public.anuncios
        WHERE status = 'active'
          AND COALESCE(renewed_at, updated_at, created_at) < (NOW() AT TIME ZONE 'UTC' - v_interval)
          AND (turbo_expires_at IS NULL OR turbo_expires_at < (NOW() AT TIME ZONE 'UTC'))
          AND NOT EXISTS (
              SELECT 1 FROM public.ad_highlights h 
              WHERE h.ad_id = public.anuncios.id 
                AND h.status = 'active' 
                AND h.ends_at > (NOW() AT TIME ZONE 'UTC')
          )
    LOOP
        v_count := v_count + 1;
        
        -- Logging candidate for expiration (ID, Owner, and Last Activity recorded)
        INSERT INTO public.ad_cleanup_logs (ad_id, owner_id, title, status, event, details)
        VALUES (
            v_ad_record.id, 
            v_ad_record.user_id, 
            v_ad_record.titulo, 
            'dry_run_candidate', 
            'expiration_check_v1', 
            jsonb_build_object(
                'last_activity', v_ad_record.last_activity,
                'days_since_activity', EXTRACT(DAY FROM (NOW() - v_ad_record.last_activity)),
                'mode', CASE WHEN p_dry_run THEN 'DRY_RUN' ELSE 'LIVE' END
            )
        );

        -- PERFORM REAL UPDATE ONLY IF p_dry_run IS FALSE (Safety Guard)
        IF NOT p_dry_run THEN
            UPDATE public.anuncios 
            SET status = 'expired', 
                updated_at = NOW() 
            WHERE id = v_ad_record.id;
            
            -- Prepare notification for the owner
            -- Note: We only insert if the notifications table exists and columns match
            INSERT INTO public.notifications (user_id, ad_id, type, title, message)
            VALUES (
                v_ad_record.user_id, 
                v_ad_record.id, 
                'expiration', 
                'Anúncio Expirado', 
                'O seu anúncio "' || v_ad_record.titulo || '" expirou após 30 dias de inatividade. Você pode renová-lo em breve.'
            ) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    -- Final summary log for the batch
    INSERT INTO public.ad_cleanup_logs (event, details)
    VALUES (
        'expiration_cycle_finished_v1',
        jsonb_build_object(
            'candidates_found', v_count,
            'dry_run', p_dry_run,
            'timestamp', NOW()
        )
    );
    
    RAISE NOTICE 'Expiration cycle finished. Candidates found: %', v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Schedule Automation (Every day at 03:00 AM UTC - DRY RUN MODE ENABLED BY DEFAULT)
-- Instructions for the Admin: 
-- To enable the cron, run the following command once in the Supabase SQL Editor:
-- SELECT cron.schedule('ads-expiration-lifecycle-v1', '0 3 * * *', 'SELECT public.execute_ads_expiration_v1(TRUE)');

COMMENT ON FUNCTION public.execute_ads_expiration_v1(BOOLEAN) IS 'Phase 1 Expiration System: Identifies and logs ads older than 30 days based on COALESCE(renewed_at, updated_at, created_at). Default is DRY RUN.';
