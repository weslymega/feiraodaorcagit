-- ETAPA 2 (CORRIGIDA): Endurecimento da tabela public.anuncios
-- OBJETIVO: Bloquear alteração de status, dono e planos de destaque por usuários comuns na tabela correta.
-- NOTA: O script original usou 'public.ads' por engano.

-- 1. Criar/Atualizar Função de Proteção (Idempotente)
CREATE OR REPLACE FUNCTION public.protect_ads_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Se role for 'service_role' (Edge Functions / Admin via service key), permitir tudo.
    IF (auth.role() = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- 2. Se o usuário NÃO for 'admin', aplicar restrições.
    -- Unificado com a função public.is_admin() para consistência.
    IF NOT public.is_admin() THEN

        -- VERIFICAÇÃO DE DONO: o usuário logado deve ser o dono do anúncio.
        -- Bloqueia tentativa de editar anúncio de terceiros.
        IF OLD.user_id != auth.uid() THEN
            RAISE EXCEPTION 'Security Violation: You do not own this ad.';
        END IF;

        -- Bloqueio de troca de dono (user_id).
        -- Previne Mass Assignment de posse.
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
            IF NEW.status = 'active' OR NEW.status = 'ativo' THEN
                RAISE EXCEPTION 'Security Violation: Ad activation requires admin approval.';
            END IF;

            -- Bloquear rejeição manual.
            IF NEW.status = 'rejected' THEN
                RAISE EXCEPTION 'Security Violation: Invalid status transition.';
            END IF;

            -- Permitir 'sold', 'paused' ou 'arquivado' APENAS se o status atual for 'active'/'ativo'.
            IF NEW.status IN ('sold', 'paused', 'arquivado') AND OLD.status NOT IN ('active', 'ativo') THEN
                RAISE EXCEPTION 'Security Violation: Can only mark as sold or paused if the ad is active.';
            END IF;

        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- 2. Remover trigger órfão da tabela 'ads' (se existir)
DROP TRIGGER IF EXISTS enforce_ads_protection ON public.ads;

-- 3. Criar trigger na tabela CORRETA: anuncios
DROP TRIGGER IF EXISTS enforce_ads_protection ON public.anuncios;
CREATE TRIGGER enforce_ads_protection
    BEFORE UPDATE ON public.anuncios
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_ads_fields();

-- Log de confirmação
DO $$ BEGIN
    RAISE NOTICE 'Trigger enforce_ads_protection corrigido e aplicado a public.anuncios.';
END $$;
