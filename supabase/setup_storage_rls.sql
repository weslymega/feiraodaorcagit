-- ==========================================
-- CONFIGURAÇÃO DE STORAGE - FEIRÃO DA ORCA
-- ==========================================

-- 1. CRIAR BUCKETS (SE NÃO EXISTIREM)
-- ads-images: Para fotos dos anúncios (Público)
-- chat-images: Para fotos enviadas no chat (Público)

INSERT INTO storage.buckets (id, name, public)
VALUES ('ads-images', 'ads-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS PARA ads-images

-- Permitir leitura pública (SELECT)
DO $$ BEGIN
    CREATE POLICY "Public Read Ads" ON storage.objects
    FOR SELECT USING (bucket_id = 'ads-images');
EXCEPTION WHEN others THEN NULL; END $$;

-- Permitir upload apenas para usuários logados (INSERT)
DO $$ BEGIN
    CREATE POLICY "Authenticated Insert Ads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ads-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN others THEN NULL; END $$;


-- 3. POLÍTICAS PARA chat-images

-- Permitir leitura pública (SELECT)
DO $$ BEGIN
    CREATE POLICY "Public Read Chat" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat-images');
EXCEPTION WHEN others THEN NULL; END $$;

-- Permitir upload apenas para usuários logados (INSERT)
DO $$ BEGIN
    CREATE POLICY "Authenticated Insert Chat" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN others THEN NULL; END $$;
