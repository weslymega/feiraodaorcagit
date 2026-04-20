-- Atualizar a função master atômica para suportar idempotência via reward_id
CREATE OR REPLACE FUNCTION public.apply_turbo_reward_atomic(
    ad_id UUID, 
    p_user_id UUID DEFAULT NULL,
    p_reward_id TEXT DEFAULT NULL
)
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
    v_existing_claim_id UUID;
BEGIN
    -- 0. Determinar o UID efetivo
    v_effective_user_id := COALESCE(p_user_id, auth.uid());

    -- 1. VERIFICAÇÃO DE IDEMPOTÊNCIA (Se reward_id for fornecido)
    IF p_reward_id IS NOT NULL THEN
        SELECT id INTO v_existing_claim_id 
        FROM public.ad_reward_claims 
        WHERE reward_id = p_reward_id;

        IF FOUND THEN
            -- Se já foi processado, retornamos os dados atuais do anúncio sem aplicar lógica nova
            SELECT turbo_progress, turbo_type, turbo_expires_at INTO v_ad 
            FROM public.anuncios 
            WHERE id = ad_id;

            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'turbo_progress', v_ad.turbo_progress,
                'turbo_type', v_ad.turbo_type,
                'turbo_expires_at', v_ad.turbo_expires_at,
                'message' , 'IDEMPOTENT_REWARD_ALREADY_PROCESSED'
            );
        END IF;
    END IF;

    -- 2. BLOQUEIO E VALIDAÇÃO DE POSSE (Row level lock)
    SELECT * INTO v_ad 
    FROM public.anuncios 
    WHERE id = ad_id AND user_id = v_effective_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Anúncio não encontrado ou posse não validada para o usuário %', v_effective_user_id;
    END IF;

    -- 3. CALCULAR NOVO PROGRESSO E LÓGICA DE NEGÓCIO
    v_new_progress := COALESCE(v_ad.turbo_progress, 0) + 1;
    v_old_type := v_ad.turbo_type;

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

    -- 4. ATUALIZAR CAMPOS DO ANÚNCIO
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

    -- 5. REGISTRAR CLAIM DE IDEMPOTÊNCIA (Se reward_id for fornecido)
    IF p_reward_id IS NOT NULL THEN
        INSERT INTO public.ad_reward_claims (reward_id, user_id, ad_id)
        VALUES (p_reward_id, v_effective_user_id, ad_id);
    END IF;

    -- 6. FORMATAR RESPOSTA
    v_result := jsonb_build_object(
        'success', true,
        'idempotent', false,
        'turbo_progress', v_new_progress,
        'turbo_type', v_new_type,
        'previous_turbo_type', v_old_type,
        'turbo_expires_at', v_ad.turbo_expires_at,
        'user_id_used', v_effective_user_id
    );

    RETURN v_result;
END;
$$;
