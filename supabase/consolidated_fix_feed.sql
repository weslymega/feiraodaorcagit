-- =============================================================================
-- CONSOLIDATED FIX: FEED RPC, VIEW & RLS (POST-STANDARDIZATION) - V3 (DROP FIX)
-- =============================================================================
-- Objective: Fix 400 error (active_highlight) and ensure 'active' status usage.
-- V3: Force drop view to allow changing column type from ad_status to text.

-- 1️⃣ Limpeza Preventiva (Obrigatória para mudar tipos de coluna)
DROP FUNCTION IF EXISTS public.get_feed(INTEGER, INTEGER, TEXT);
DROP VIEW IF EXISTS public.ads_ranked CASCADE;

-- 2️⃣ Recriar VIEW ads_ranked
CREATE OR REPLACE VIEW public.ads_ranked AS
SELECT 
    a.id,
    a.user_id,
    a.titulo,
    a.descricao,
    a.preco,
    a.categoria,
    a.status::TEXT as status, -- Garantir casting para texto
    a.imagens,
    a.localizacao,
    a.detalhes,
    a.boost_plan,
    a.created_at,
    a.updated_at,
    a.is_in_fair,
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

-- 3️⃣ Recriar RPC get_feed
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
    profiles JSONB
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
        ar.status = 'active'
        AND (category_filter IS NULL OR ar.categoria = category_filter)
    ORDER BY 
        ar.is_turbo_active DESC,
        ar.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4️⃣ Garantir Políticas de RLS
DROP POLICY IF EXISTS "anuncios_select_policy" ON public.anuncios;
CREATE POLICY "anuncios_select_policy"
ON public.anuncios
FOR SELECT
USING (
    (status::TEXT = 'active')
    OR (auth.uid() = user_id)
    OR (public.is_admin())
);

-- 5️⃣ Migração de Dados Final
UPDATE public.anuncios SET status = 'active' WHERE status::TEXT = 'ativo';
