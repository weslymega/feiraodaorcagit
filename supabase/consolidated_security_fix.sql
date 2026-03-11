
-- =============================================================================
-- FINAL CLEANUP: SECURITY TRIGGERS ON public.anuncios
-- OBJETIVO: Eliminar triggers duplicados/fantasmas e unificar a proteção.
-- =============================================================================

-- 1. Remover triggers conhecidos e possíveis nomes alternativos
DROP TRIGGER IF EXISTS protect_turbo_fields_anuncios ON public.anuncios;
DROP TRIGGER IF EXISTS enforce_ads_protection ON public.anuncios;
DROP TRIGGER IF EXISTS protect_ads_fields_trigger ON public.anuncios;
DROP TRIGGER IF EXISTS limit_turbo_updates ON public.anuncios;

-- 2. Criar/Atualizar a Função Unificada (V9)
-- Esta função permite que o SISTEMA (service_role) atualize campos sensíveis,
-- mas bloqueia tentativas manuais do usuário.
CREATE OR REPLACE FUNCTION public.protect_ads_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. PERMISSÃO ADMINISTRATIVA
    -- Se a chamada vem de uma Edge Function ou do Dashboard (Admin), permitir TUDO.
    IF (current_setting('request.jwt.claim.role', true) IN ('service_role', 'supabase_admin')) 
       OR (auth.role() = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- 2. RESTRIÇÕES PARA USUÁRIOS COMUNS
    -- Se não for Admin, aplicamos as travas de segurança.
    IF NOT public.is_admin() THEN

        -- A. POSSE: Só o dono pode editar (exceto campos sensíveis)
        IF OLD.user_id != auth.uid() THEN
            RAISE EXCEPTION 'Security Violation: Você não é o dono deste anúncio.';
        END IF;

        -- B. CAMPOS IMUTÁVEIS (Mass Assignment Protection)
        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Security Violation: Não é permitido trocar o dono do anúncio.';
        END IF;

        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Security Violation: A data de criação não pode ser alterada.';
        END IF;

        -- C. PROTEÇÃO DE CAMPOS TURBO/DESTAQUE
        -- Estes campos SÓ podem ser alterados pelo backend (Edge Functions).
        IF (NEW.is_turbo IS DISTINCT FROM OLD.is_turbo) OR
           (NEW.turbo_type IS DISTINCT FROM OLD.turbo_type) OR
           (NEW.boost_plan IS DISTINCT FROM OLD.boost_plan) OR
           (NEW.turbo_expires_at IS DISTINCT FROM OLD.turbo_expires_at) THEN
            RAISE EXCEPTION 'Security Violation: a alteração de campos turbo só é permitida via código do backend (edge functions).';
        END IF;

        -- D. REGRAS DE STATUS (Moderação)
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            -- Bloquear ativação manual
            IF NEW.status IN ('active', 'ativo') THEN
                RAISE EXCEPTION 'Security Violation: A ativação de anúncios requer aprovação administrativa.';
            END IF;
            
            -- Bloquear transições inválidas
            IF NEW.status = 'rejected' THEN
                RAISE EXCEPTION 'Security Violation: Transição de status inválida.';
            END IF;

            -- Sold/Paused somente se estiver ativo
            IF NEW.status IN ('sold', 'paused', 'arquivado') AND OLD.status NOT IN ('active', 'ativo') THEN
                RAISE EXCEPTION 'Security Violation: Só é possível marcar como vendido/pausado se estiver ativo.';
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- 3. Reinstalar o Trigger unificado
CREATE TRIGGER enforce_ads_protection
    BEFORE UPDATE ON public.anuncios
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_ads_fields();

-- Log de Confirmação
DO $$ BEGIN
    RAISE NOTICE 'Limpeza concluída. Trigger enforce_ads_protection reinstalado e unificado.';
END $$;
