-- FIX FOR OWNER NAME DISPLAY ISSUE
-- Date: 2026-03-11
-- Objective: Ensure the ad feed includes owner information (profiles join)

-- 1. Create or Update the View that joins profiles
-- This avoids "Usuario não encontrado" by ensuring the name and avatar are available in the result set
CREATE OR REPLACE VIEW public.ads_ranked AS
SELECT 
    a.*,
    p.name as owner_name,
    p.avatar_url as owner_avatar,
    EXISTS (
        SELECT 1 FROM ad_turbo_sessions s 
        WHERE s.ad_id = a.id 
        AND s.status = 'active' 
        AND s.expires_at > now()
    ) as is_turbo_active,
    (
        SELECT s.expires_at FROM ad_turbo_sessions s 
        WHERE s.ad_id = a.id 
        AND s.status = 'active' 
        AND s.expires_at > now()
        LIMIT 1
    ) as turbo_expires_at
FROM public.anuncios a
LEFT JOIN public.profiles p ON a.user_id = p.id;

-- 2. Update the RPC function to use the enriched view
-- This function is called by the frontend via api.getAds()
CREATE OR REPLACE FUNCTION public.get_feed(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0,
    category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    titulo TEXT,
    descricao TEXT,
    preco DECIMAL,
    categoria TEXT,
    status TEXT,
    imagens TEXT[],
    localizacao TEXT,
    detalhes JSONB,
    boost_plan TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_in_fair BOOLEAN,
    is_turbo_active BOOLEAN,
    turbo_expires_at TIMESTAMPTZ,
    profiles JSONB -- We'll return the profile part as a JSON object to match Supabase's format
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.user_id,
        ar.titulo,
        ar.descricao,
        ar.preco,
        ar.categoria,
        ar.status,
        ar.imagens,
        ar.localizacao,
        ar.detalhes,
        ar.boost_plan,
        ar.created_at,
        ar.updated_at,
        ar.is_in_fair,
        ar.is_turbo_active,
        ar.turbo_expires_at,
        jsonb_build_object('name', ar.owner_name, 'avatar_url', ar.owner_avatar) as profiles
    FROM public.ads_ranked ar
    WHERE 
        ar.status = 'ativo'
        AND (category_filter IS NULL OR ar.categoria = category_filter)
    ORDER BY 
        ar.is_turbo_active DESC,
        ar.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;
