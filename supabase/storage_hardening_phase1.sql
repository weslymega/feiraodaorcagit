-- =============================================================
-- HARDENING DE STORAGE: ETAPA 1 (FEIRÃO DA ORCA)
-- DATA: 2026-04-03
-- OBJETIVO: Implementar limites de segurança e isolamento por pasta
-- =============================================================

-- 1. ATUALIZAÇÃO DOS BUCKETS COM LIMITES DE TAMANHO E TIPO
-- Definimos 5MB (5242880 bytes) como limite de segurança.
-- Restringimos apenas para formatos de imagem padrão.

UPDATE storage.buckets 
SET 
    file_size_limit = 5242880,
    allowed_mime_types = '{image/jpeg, image/png, image/webp}',
    public = true -- Mantemos público para visualização
WHERE id IN ('ads-images', 'chat-images');

-- 2. LIMPEZA DE POLÍTICAS ANTIGAS (PARA EVITAR COMPORTAMENTO PERMISSIVO)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read Ads" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Insert Ads" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read Chat" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Insert Chat" ON storage.objects;
    
    -- Remover quaisquer outras políticas genéricas que possam existir
    DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Own Folder" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Update Own Folder" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Delete Own Folder" ON storage.objects;
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. NOVAS POLÍTICAS DE RLS REFORÇADAS

-- [SELECT] - Leitura Pública (Marketplace funciona sem login para ver anúncios)
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id IN ('ads-images', 'chat-images'));

-- [INSERT] - Upload apenas para pasta própria (auth.uid())
-- Verifica se o primeiro folder name corresponde ao UID do usuário logado
CREATE POLICY "Authenticated Upload Own Folder" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id IN ('ads-images', 'chat-images') 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- [UPDATE] - Atualização apenas de arquivos próprios
CREATE POLICY "Authenticated Update Own Folder" ON storage.objects
FOR UPDATE USING (
    bucket_id IN ('ads-images', 'chat-images') 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
    (storage.foldername(name))[1] = auth.uid()::text
);

-- [DELETE] - Deleção apenas de arquivos próprios
CREATE POLICY "Authenticated Delete Own Folder" ON storage.objects
FOR DELETE USING (
    bucket_id IN ('ads-images', 'chat-images') 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================
-- HARDENING ETAPA 1 CONCLUÍDO
-- =============================================================
