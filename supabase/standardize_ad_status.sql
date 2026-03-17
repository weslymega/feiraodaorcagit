-- ETAPA 1: Executar SOZINHO e clicar em RUN
ALTER TYPE public.ad_status ADD VALUE IF NOT EXISTS 'archived';

-- ==========================================================
-- ETAPA 2: Executar SOMENTE APÓS a Etapa 1 terminar
-- ==========================================================
/*
BEGIN;

-- Desativa o trigger que causa o erro de cast
DROP TRIGGER IF EXISTS enforce_ads_protection ON public.anuncios;

-- Atualiza dados
UPDATE public.anuncios 
SET status = CASE 
    WHEN status::text IN ('ativo', 'active') THEN 'active'::public.ad_status
    WHEN status::text IN ('pendente', 'pending') THEN 'pending'::public.ad_status
    WHEN status::text IN ('rejeitado', 'rejected') THEN 'rejected'::public.ad_status
    WHEN status::text IN ('vendido', 'sold') THEN 'sold'::public.ad_status
    WHEN status::text IN ('inativo', 'pausado', 'paused') THEN 'paused'::public.ad_status
    WHEN status::text IN ('arquivado', 'archived') THEN 'archived'::public.ad_status
    ELSE status
END;

-- Reinstala função limpa
CREATE OR REPLACE FUNCTION public.protect_ads_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (current_setting('request.jwt.claim.role', true) IN ('service_role', 'supabase_admin')) 
       OR (auth.role() = 'service_role') THEN
        RETURN NEW;
    END IF;

    IF NOT public.is_admin() THEN
        IF OLD.user_id != auth.uid() THEN
            RAISE EXCEPTION 'Security Violation: Você não é o dono.';
        END IF;
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF NEW.status = 'active' THEN
                RAISE EXCEPTION 'Security Violation: Ativação requer admin.';
            END IF;
            IF NEW.status IN ('sold', 'paused', 'archived') AND OLD.status != 'active' THEN
                RAISE EXCEPTION 'Security Violation: Status bloqueado para este estado.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Reativa o trigger
CREATE TRIGGER enforce_ads_protection
    BEFORE UPDATE ON public.anuncios
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_ads_fields();

COMMIT;
*/
