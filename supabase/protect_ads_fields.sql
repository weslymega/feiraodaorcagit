-- ETAPA 2: Endurecimento da tabela public.ads
-- OBJETIVO: Bloquear alteração de status, dono e planos de destaque por usuários comuns.
-- Execute este script no SQL Editor do Supabase.
-- ROLLBACK: DROP TRIGGER IF EXISTS enforce_ads_protection ON public.ads; DROP FUNCTION IF EXISTS public.protect_ads_fields();

CREATE OR REPLACE FUNCTION public.protect_ads_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role text;
BEGIN
    -- 1. Se role for 'service_role' (Edge Functions / Admin), permitir tudo.
    IF (auth.role() = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- 2. Buscar o role do usuário atual no banco.
    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE id = auth.uid();

    -- 3. Se o usuário NÃO for 'admin', aplicar restrições.
    IF COALESCE(v_user_role, 'user') != 'admin' THEN

        -- VERIFICAÇÃO DE DONO: o usuário logado deve ser o dono do anúncio.
        IF OLD.user_id != auth.uid() THEN
            RAISE EXCEPTION 'Security Violation: You do not own this ad.';
        END IF;

        -- Bloqueio de troca de dono (user_id).
        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Security Violation: Cannot change ad ownership.';
        END IF;

        -- Bloqueio de troca de plano de destaque (boost_plan).
        -- Apenas o sistema de pagamentos (service_role) pode alterar isso.
        IF NEW.boost_plan IS DISTINCT FROM OLD.boost_plan THEN
            RAISE EXCEPTION 'Security Violation: Boost plan updates must use the payment system.';
        END IF;

        -- Proteção da data de criação.
        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Security Violation: created_at is immutable.';
        END IF;

        -- Regras de Status (Moderação).
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            
            -- Bloquear ativação manual (pular moderação).
            IF NEW.status = 'active' THEN
                RAISE EXCEPTION 'Security Violation: Ad activation requires admin approval.';
            END IF;

            -- Bloquear rejeição manual.
            IF NEW.status = 'rejected' THEN
                RAISE EXCEPTION 'Security Violation: Invalid status transition.';
            END IF;

            -- Permitir 'sold' ou 'paused' APENAS se o status atual for 'active'.
            IF NEW.status IN ('sold', 'paused') AND OLD.status != 'active' THEN
                RAISE EXCEPTION 'Security Violation: Can only mark as sold or paused if the ad is active.';
            END IF;

        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS enforce_ads_protection ON public.ads;
CREATE TRIGGER enforce_ads_protection
    BEFORE UPDATE ON public.ads
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_ads_fields();
