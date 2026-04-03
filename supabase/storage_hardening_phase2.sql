-- =============================================================
-- HARDENING DE STORAGE: ETAPA 2 (FEIRÃO DA ORCA)
-- DATA: 2026-04-03
-- OBJETIVO: Rate Limiting e Cota Integrada ao RLS
-- =============================================================

-- 1. LIMPEZA DE POLÍTICAS ANTERIORES (CONSOLIDANDO)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated Upload Own Folder" ON storage.objects;
EXCEPTION WHEN others THEN NULL; END $$;

-- 2. NOVA POLÍTICA DE INSERT (COM RATE LIMIT E COTA)
-- Esta política chama a função public.enforce_user_limits('upload') 
-- que verifica se o usuário já subiu mais de 30 fotos na última hora 
-- ou se já atingiu o limite de 50MB no storage total.

CREATE POLICY "Authenticated Upload Own Folder (Restricted)" ON storage.objects
FOR INSERT WITH CHECK (
    -- Regra 1: Bucket de anúncios ou chat
    bucket_id IN ('ads-images', 'chat-images') 
    
    -- Regra 2: Usuário Autenticado
    AND auth.role() = 'authenticated'
    
    -- Regra 3: Isolamento por Pasta (Folder Name segment deve ser o UID)
    AND (storage.foldername(name))[1] = auth.uid()::text
    
    -- Regra 4: Limites de Rate Limit e Cota (Anti-Abuso)
    -- Se a função retornar false ou der erro, o upload falha
    AND public.enforce_user_limits('upload')
);

-- Nota: SELECT, UPDATE e DELETE permanecem com as permissões 
-- da Etapa 1 por não gerarem consumo agressivo de nova cota/frequência.

-- =============================================================
-- HARDENING ETAPA 2 CONCLUÍDO
-- =============================================================
