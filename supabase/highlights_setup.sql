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

-- 2. ENSURE PAYMENTS TABLE EXISTS
-- Some schemas might use different names, but we need public.payments for logs.
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    mp_payment_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    plan_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- 3. AD HIGHLIGHTS
-- Note: Using public.anuncios instead of public.ads which is the current table name.
CREATE TABLE IF NOT EXISTS public.ad_highlights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_id UUID REFERENCES public.anuncios(id) ON DELETE CASCADE NOT NULL,
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

-- 4. UPDATE PAYMENTS TABLE WITH NEW COLUMNS
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS ad_id UUID REFERENCES public.anuncios(id),
ADD COLUMN IF NOT EXISTS highlight_plan_id UUID REFERENCES public.highlight_plans(id),
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 5. RLS POLICIES

-- highlight_plans: Public read
ALTER TABLE public.highlight_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view highlight plans" ON public.highlight_plans;
CREATE POLICY "Public can view highlight plans" ON public.highlight_plans
    FOR SELECT USING (active = true);

-- ad_highlights: Anyone can see if an ad is highlighted (needed for the UI)
ALTER TABLE public.ad_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active highlights" ON public.ad_highlights;
CREATE POLICY "Public can view active highlights" ON public.ad_highlights
    FOR SELECT USING (true);

-- Only owner/admin can see specific highlight details
DROP POLICY IF EXISTS "Users can view own highlights" ON public.ad_highlights;
CREATE POLICY "Users can view own highlights" ON public.ad_highlights
    FOR SELECT USING (auth.uid() = user_id);

-- 6. FUNCTION TO MARK EXPIRED HIGHLIGHTS
CREATE OR REPLACE FUNCTION public.update_expired_highlights() 
RETURNS VOID AS $$
BEGIN
    UPDATE public.ad_highlights
    SET status = 'expired'
    WHERE ends_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
