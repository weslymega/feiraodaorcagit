-- ETAPA 1: CORREÇÃO MÍNIMA
-- Adiciona colunas necessárias para o registro de aceite de termos.
-- Script idempotente e seguro para dados existentes.

DO $$ 
BEGIN
    -- Adiciona accepted_terms se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accepted_terms') THEN
        ALTER TABLE public.profiles ADD COLUMN accepted_terms BOOLEAN DEFAULT false;
    END IF;

    -- Adiciona accepted_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accepted_at') THEN
        ALTER TABLE public.profiles ADD COLUMN accepted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Comentários das colunas
COMMENT ON COLUMN public.profiles.accepted_terms IS 'True se o usuário aceitou os Termos de Uso e Política de Privacidade.';
COMMENT ON COLUMN public.profiles.accepted_at IS 'Data e hora do aceite.';
