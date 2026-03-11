
-- =============================================================================
-- REMOÇÃO DE TRIGGER DUPLICADO - TABELA public.anuncios
-- OBJETIVO: Eliminar o conflito que bloqueia ativação de Turbo.
-- =============================================================================

-- 1. Remover o trigger que está causando o conflito
-- Este trigger bloqueia campos turbo com a mensagem "a alteração de campos turbo..."
DROP TRIGGER IF EXISTS tr_protect_turbo_fields_anuncios ON public.anuncios;

-- 2. Remover a função orfã associada ao trigger removido
DROP FUNCTION IF EXISTS public.protect_turbo_fields_anuncios();

-- 3. Log de Confirmação
DO $$ 
BEGIN 
    RAISE NOTICE 'Trigger tr_protect_turbo_fields_anuncios removido com sucesso.';
    RAISE NOTICE 'A proteção unificada via enforce_ads_protection continua ativa.';
END $$;

-- DICA: Você pode rodar este comando para listar os triggers ativos e confirmar:
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.anuncios'::regclass AND tgisinternal = false;
