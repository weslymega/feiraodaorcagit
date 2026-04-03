-- =============================================================================
-- SISTEMA ANTI-ABUSO E PROTEÇÃO DE ESCALA (FEIRÃO DA ORCA)
-- DATA: 2026-04-03
-- OBJETIVO: Rate Limiting, Cotas de Storage e Limpeza de Órfãos
-- =============================================================================

-- 1. TABELA DE LOGS DE ATIVIDADE (Leve para Rate Limiting)
CREATE TABLE IF NOT EXISTS public.user_security_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'upload', 'ad_creation', etc.
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexar para busca rápida por tempo e usuário
CREATE INDEX IF NOT EXISTS idx_user_security_logs_uid_time ON public.user_security_logs(user_id, created_at DESC);

-- 2. FUNÇÃO CENTRALIZADA DE LIMITES (ENFORCE LIMITS)
CREATE OR REPLACE FUNCTION public.enforce_user_limits(check_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID := auth.uid();
    upload_count_hour INTEGER;
    ad_count_day INTEGER;
    total_size_bytes BIGINT;
    MAX_UPLOADS_PER_HOUR CONSTANT INTEGER := 30;
    MAX_ADS_PER_DAY CONSTANT INTEGER := 10;
    MAX_STORAGE_MB CONSTANT INTEGER := 50;
    MAX_STORAGE_BYTES CONSTANT BIGINT := 50 * 1024 * 1024;
BEGIN
    -- Se for Service Role ou Admin, ignora limites
    IF current_user_id IS NULL OR public.is_admin() THEN
        RETURN TRUE;
    END IF;

    -- A. RATE LIMIT DE UPLOAD (30/hora)
    IF check_type = 'upload' THEN
        -- Verificar frequência
        SELECT COUNT(*) INTO upload_count_hour 
        FROM public.user_security_logs 
        WHERE user_id = current_user_id 
          AND action = 'upload' 
          AND created_at > now() - interval '1 hour';

        IF upload_count_hour >= MAX_UPLOADS_PER_HOUR THEN
            RAISE EXCEPTION 'Limite de uploads excedido (Máximo % por hora).', MAX_UPLOADS_PER_HOUR;
        END IF;

        -- Verificar COTA DE STORAGE (50MB)
        -- Nota: Consultamos storage.objects filtrando pela pasta do UID do usuário
        SELECT COALESCE(SUM( (metadata->>'size')::BIGINT ), 0) INTO total_size_bytes
        FROM storage.objects
        WHERE bucket_id IN ('ads-images', 'chat-images')
          AND (storage.foldername(name))[1] = current_user_id::TEXT;

        IF total_size_bytes >= MAX_STORAGE_BYTES THEN
            RAISE EXCEPTION 'Cota de armazenamento excedida (Limite: %MB). Remova anúncios antigos.', MAX_STORAGE_MB;
        END IF;

        -- Logar sucesso para o próximo check
        INSERT INTO public.user_security_logs (user_id, action) VALUES (current_user_id, 'upload');
        RETURN TRUE;
    END IF;

    -- B. RATE LIMIT DE ANÚNCIOS (10/dia)
    IF check_type = 'ad_creation' THEN
        SELECT COUNT(*) INTO ad_count_day 
        FROM public.anuncios 
        WHERE user_id = current_user_id 
          AND created_at > now() - interval '24 hours';

        IF ad_count_day >= MAX_ADS_PER_DAY THEN
            RAISE EXCEPTION 'Limite de anúncios diários atingido (Máximo %).', MAX_ADS_PER_DAY;
        END IF;

        RETURN TRUE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER PARA LIMITE DE ANÚNCIOS
CREATE OR REPLACE FUNCTION public.trg_check_ad_limit()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.enforce_user_limits('ad_creation');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ad_insert_check_limit ON public.anuncios;
CREATE TRIGGER on_ad_insert_check_limit
    BEFORE INSERT ON public.anuncios
    FOR EACH ROW EXECUTE PROCEDURE public.trg_check_ad_limit();

-- 4. PROCEDIMENTO DE LIMPEZA DE ÓRFÃOS (GARBAGE COLLECTOR)
CREATE OR REPLACE FUNCTION public.purge_orphan_storage_objects()
RETURNS TABLE (deleted_count INTEGER) AS $$
DECLARE
    del_count INTEGER := 0;
BEGIN
    -- Remove objetos onde:
    -- 1. Estão no bucket de imagens
    -- 2. Têm mais de 24h de vida (segurança para uploads em curso)
    -- 3. O path (name) NÃO está presente em nenhum array de 'imagens' de nenhum anúncio
    
    WITH orphans AS (
        SELECT id, name FROM storage.objects
        WHERE bucket_id = 'ads-images'
          AND created_at < now() - interval '24 hours'
          AND NOT EXISTS (
              SELECT 1 FROM public.anuncios
              WHERE imagens @> ARRAY[
                  -- Dependendo da URL salva, podemos precisar de manipulação aqui.
                  -- Assumindo que o sistema agora salva o path ou a URL contém o path completo.
                  name
              ] OR array_to_string(imagens, ',') LIKE '%' || name || '%'
          )
    )
    DELETE FROM storage.objects WHERE id IN (SELECT id FROM orphans);
    
    GET DIAGNOSTICS del_count = ROW_COUNT;
    RETURN QUERY SELECT del_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. AGENDAMENTO OPCIONAL (Requer pg_cron habilitado no painel Supabase)
-- SELECT cron.schedule('cleanup-storage-daily', '0 3 * * *', 'SELECT public.purge_orphan_storage_objects()');

-- =============================================================================
-- SISTEMA ANTI-ABUSO IMPLEMENTADO
-- =============================================================
