-- Adiciona coluna is_in_fair na tabela anuncios
ALTER TABLE public.anuncios
ADD COLUMN IF NOT EXISTS is_in_fair BOOLEAN DEFAULT FALSE;
