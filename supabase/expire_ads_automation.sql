-- Ad Expiration Automation Logic
-- 1. Function to manage expiration lifecycle
CREATE OR REPLACE FUNCTION public.execute_ads_expiration_lifecycle()
RETURNS VOID AS $$
BEGIN
    -- PHASE A: SEND WARNING NOTIFICATIONS (27 DAYS)
    -- Insert notification for ads that are 27 days old and don't have a warning yet
    -- The UNIQUE constraint on (user_id, ad_id, type) ensures no duplicates
    INSERT INTO public.notifications (user_id, ad_id, type, title, message, image)
    SELECT 
        user_id, 
        id, 
        'expiration_warning', 
        'Seu anúncio expira em breve!', 
        'O seu anúncio "' || title || '" expira em 3 dias. Renove-o para mantê-lo ativo.',
        thumbnail_url
    FROM public.ads
    WHERE status = 'active'
      AND created_at < (NOW() AT TIME ZONE 'UTC' - INTERVAL '27 days')
      AND created_at >= (NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days')
    ON CONFLICT (user_id, ad_id, type) DO NOTHING;

    -- PHASE B: TRANSITION TO EXPIRED (30 DAYS)
    UPDATE public.ads
    SET status = 'expired'
    WHERE status = 'active'
      AND created_at < (NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days');

    -- Note: 35-day deletion is handled by the Edge Function to ensure Storage Cleanup first.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Schedule the job (Daily at 03:00 AM UTC)
-- Note: Uncomment the line below in the Supabase SQL Editor if pg_cron is enabled
-- SELECT cron.schedule('ads-expiration-lifecycle', '0 3 * * *', 'SELECT public.execute_ads_expiration_lifecycle()');
