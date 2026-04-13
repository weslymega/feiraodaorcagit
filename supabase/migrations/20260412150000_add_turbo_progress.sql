-- 1. Adicionar campo de progresso de recompensas no anúncio
ALTER TABLE public.anuncios ADD COLUMN IF NOT EXISTS turbo_progress INT DEFAULT 0;

-- 2. Atualizar a Função de Proteção (V10) para incluir turbo_progress
CREATE OR REPLACE FUNCTION public.protect_ads_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. LOG DE AUDITORIA (Temporário para Debug)
    RAISE NOTICE 'ROLE: %, USER: %', current_setting('request.jwt.claim.role', true), auth.uid();

    -- 2. PERMISSÃO ADMINISTRATIVA / SERVICE ROLE
    -- Liberamos totalmente se for service_role ou admin
    IF (current_setting('request.jwt.claim.role', true) = 'service_role') 
       OR (auth.role() = 'service_role')
       OR (current_setting('request.jwt.claim.role', true) = 'supabase_admin') THEN
        RETURN NEW;
    END IF;

    -- 3. RESTRIÇÕES PARA USUÁRIOS COMUNS
    IF NOT public.is_admin() THEN
        -- A. POSSE
        IF OLD.user_id != auth.uid() THEN
            RAISE EXCEPTION 'Security Violation: Você não é o dono deste anúncio. (BLOCKED BY TRIGGER protect_ads_fields)';
        END IF;

        -- B. CAMPOS IMUTÁVEIS
        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Security Violation: Não é permitido trocar o dono do anúncio. (BLOCKED BY TRIGGER protect_ads_fields)';
        END IF;

        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Security Violation: A data de criação não pode ser alterada. (BLOCKED BY TRIGGER protect_ads_fields)';
        END IF;

        -- C. PROTEÇÃO DE CAMPOS TURBO/DESTAQUE
        -- Bloqueamos a alteração direta via RLS/Rest API para campos sensíveis
        IF (NEW.is_turbo IS DISTINCT FROM OLD.is_turbo) OR
           (NEW.turbo_type IS DISTINCT FROM OLD.turbo_type) OR
           (NEW.boost_plan IS DISTINCT FROM OLD.boost_plan) OR
           (NEW.turbo_expires_at IS DISTINCT FROM OLD.turbo_expires_at) OR
           (NEW.turbo_progress IS DISTINCT FROM OLD.turbo_progress) THEN
            RAISE EXCEPTION 'Security Violation: alteração de campos turbo só é permitida via código do backend. (BLOCKED BY TRIGGER protect_ads_fields)';
        END IF;

        -- D. REGRAS DE STATUS
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF NEW.status IN ('active', 'ativo') THEN
                RAISE EXCEPTION 'Security Violation: A ativação requer aprovação administrativa. (BLOCKED BY TRIGGER protect_ads_fields)';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Função RPC para incremento atômico de progresso (Prevenção de Race Condition)
CREATE OR REPLACE FUNCTION public.increment_turbo_progress(ad_id UUID)
RETURNS INT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE new_value INT;
BEGIN
  UPDATE public.anuncios
  SET 
    turbo_progress = COALESCE(turbo_progress, 0) + 1,
    updated_at = NOW()
  WHERE id = ad_id
  RETURNING turbo_progress INTO new_value;

  RETURN new_value;
END;
$$;

-- 4. Função RPC para atualização atômica de expiração (Prevenção de Race Condition no Tempo)
CREATE OR REPLACE FUNCTION public.update_turbo_expiry_atomic(ad_id UUID, days_to_add INT, new_type TEXT)
RETURNS public.anuncios 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE updated_ad public.anuncios;
BEGIN
  UPDATE public.anuncios
  SET 
    is_turbo = true,
    turbo_type = new_type,
    boost_plan = new_type,
    last_turbo_at = NOW(),
    turbo_expires_at = CASE 
      WHEN turbo_expires_at > NOW() THEN turbo_expires_at + (days_to_add || ' days')::INTERVAL
      ELSE NOW() + (days_to_add || ' days')::INTERVAL
    END,
    updated_at = NOW()
  WHERE id = ad_id
  RETURNING * INTO updated_ad;

  RETURN updated_ad;
END;
$$;

-- 5. FUNÇÃO MASTER ATÔMICA (Destaque Progressivo Unificado)
-- Esta função executa todo o fluxo de lógica (Nível + Tempo + Progresso) de forma transacional.
CREATE OR REPLACE FUNCTION public.apply_turbo_reward_atomic(ad_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ad RECORD;
    v_new_progress INT;
    v_new_type TEXT;
    v_days_to_add INT;
    v_old_type TEXT;
    v_result JSONB;
    v_effective_user_id UUID;
BEGIN
    -- Determinar o UID efetivo (se passado por admin, usar o passado, senão usar a sessão)
    v_effective_user_id := COALESCE(p_user_id, auth.uid());

    -- 1. BLOQUEIO E VALIDAÇÃO
    SELECT * INTO v_ad 
    FROM public.anuncios 
    WHERE id = ad_id AND user_id = v_effective_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Anúncio não encontrado ou posse não validada para o usuário %', v_effective_user_id;
    END IF;

    -- 2. CALCULAR NOVO PROGRESSO
    v_new_progress := COALESCE(v_ad.turbo_progress, 0) + 1;
    v_old_type := v_ad.turbo_type;

    -- 3. LOGICA DE NEGÓCIO
    IF v_new_progress = 1 THEN
        v_new_type := 'premium';
        v_days_to_add := 1;
    ELSIF v_new_progress = 2 THEN
        v_new_type := 'pro';
        v_days_to_add := 3;
    ELSE
        v_new_type := 'max';
        v_days_to_add := 7;
    END IF;

    -- 4. ATUALIZAR CAMPOS
    UPDATE public.anuncios
    SET 
        turbo_progress = v_new_progress,
        turbo_type = v_new_type,
        boost_plan = v_new_type,
        is_turbo = true,
        last_turbo_at = NOW(),
        updated_at = NOW(),
        turbo_expires_at = CASE 
            WHEN turbo_expires_at > NOW() THEN turbo_expires_at + (v_days_to_add || ' days')::INTERVAL
            ELSE NOW() + (v_days_to_add || ' days')::INTERVAL
        END
    WHERE id = ad_id
    RETURNING turbo_expires_at INTO v_ad.turbo_expires_at;

    -- 5. FORMATAR RESPOSTA
    v_result := jsonb_build_object(
        'turbo_progress', v_new_progress,
        'turbo_type', v_new_type,
        'previous_turbo_type', v_old_type,
        'turbo_expires_at', v_ad.turbo_expires_at,
        'user_id_used', v_effective_user_id
    );

    RETURN v_result;
END;
$$;
