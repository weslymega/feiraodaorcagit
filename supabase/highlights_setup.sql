-- --- HIGHLIGHTS SETUP ---

-- 1. HIGHLIGHT PLANS
CREATE TABLE IF NOT EXISTS public.highlight_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    priority_level INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Initial Plans
INSERT INTO public.highlight_plans (name, price, duration_days, priority_level)
VALUES 
('Simples', 9.90, 7, 1),
('Premium', 19.90, 15, 2),
('Topo', 39.90, 30, 3)
ON CONFLICT DO NOTHING;

-- 2. AD HIGHLIGHTS
CREATE TABLE IF NOT EXISTS public.ad_highlights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    plan_id UUID REFERENCES public.highlight_plans(id) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ad_highlights_ad_id ON public.ad_highlights(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_highlights_status ON public.ad_highlights(status);

-- 3. UPDATE PAYMENTS TABLE
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS ad_id UUID REFERENCES public.ads(id),
ADD COLUMN IF NOT EXISTS highlight_plan_id UUID REFERENCES public.highlight_plans(id),
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 4. RLS POLICIES

-- highlight_plans: Public read
ALTER TABLE public.highlight_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view highlight plans" ON public.highlight_plans
    FOR SELECT USING (active = true);

-- ad_highlights: Public read viewable, but only owner/admin can see details if needed
-- Actually, anyone can see if an ad is highlighted (needed for the UI)
ALTER TABLE public.ad_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active highlights" ON public.ad_highlights
    FOR SELECT USING (true);

-- Only service role should insert/update ad_highlights via webhook
-- But we can allow users to see their own highlights even if they are expired
CREATE POLICY "Users can view own highlights" ON public.ad_highlights
    FOR SELECT USING (auth.uid() = user_id);

-- 5. FUNCTION TO MARK EXPIRED HIGHLIGHTS (for periodic cleanup/updates)
-- This can be called by a cron or edge function
CREATE OR REPLACE FUNCTION public.update_expired_highlights() 
RETURNS VOID AS $$
BEGIN
    UPDATE public.ad_highlights
    SET status = 'expired'
    WHERE ends_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
