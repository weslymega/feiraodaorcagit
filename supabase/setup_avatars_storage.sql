
-- SCRIPT DE CONFIGURAÇÃO DE STORAGE PARA SISTEMA DE AVATARES
-- Execute este script no SQL Editor do seu Supabase Dashboard

-- 1. CRIAR O BUCKET DE AVATARES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE ACESSO (PERMITIR LEITURA PÚBLICA)
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. POLÍTICAS DE UPLOAD (APENAS USUÁRIOS AUTENTICADOS PODEM SUBIR - Ajuste conforme necessidade)
-- Normalmente em um Marketplace, o Admin sobe os sprites oficiais.
CREATE POLICY "Admins podem gerenciar avatares"
ON storage.objects FOR ALL
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- INSTRUÇÕES DE ESTRUTURA:
-- No bucket 'avatars', crie uma pasta para cada ID (ex: 'orca_v1')
-- Dentro de cada pasta, envie:
-- 1. sprite.png (Imagem horizontal com todos os frames da animação)
-- 2. static.png (O primeiro frame ou imagem representante estática)

-- Exemplo de caminho: avatars/orca_v1/sprite.png
