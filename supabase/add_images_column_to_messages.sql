-- =========================================================================
-- MIGRATION: Fix Missing Images Column in Messages Table
-- =========================================================================

-- Adiciona a coluna 'images' (JSONB) à tabela 'messages'
-- Este campo armazenará um array JSON de URLs de imagens
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS images JSONB;

-- Comentário para documentar o campo
COMMENT ON COLUMN public.messages.images IS 'Array JSON de URLs de imagens enviadas no chat';

-- Verificação: O campo deve aceitar NULL por padrão.
-- Se mensagens antigas existirem, elas terão NULL neste campo.
