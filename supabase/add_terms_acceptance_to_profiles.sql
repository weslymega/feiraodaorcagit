-- Adiciona colunas para controle de aceite de termos na tabela profiles
-- Essencial para conformidade com as regras da Google Play e Apple Store em login social.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accepted_terms') THEN
        ALTER TABLE public.profiles ADD COLUMN accepted_terms BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accepted_at') THEN
        ALTER TABLE public.profiles ADD COLUMN accepted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Comentário para documentação do banco
COMMENT ON COLUMN public.profiles.accepted_terms IS 'Indica se o usuário aceitou explicitamente os Termos de Uso e Política de Privacidade.';
COMMENT ON COLUMN public.profiles.accepted_at IS 'Data e hora do último aceite dos termos.';
