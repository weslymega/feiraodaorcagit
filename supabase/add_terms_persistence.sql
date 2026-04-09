-- Migração: Adiciona persistência de termos com versionamento
-- Descrição: Adiciona as colunas solicitadas para controle de aceite de termos.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Comentários (Opcional, mas boa prática)
COMMENT ON COLUMN public.profiles.terms_accepted IS 'True se o usuário aceitou os termos vindo do novo sistema de persistência.';
COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Timestamp do último aceite.';
COMMENT ON COLUMN public.profiles.terms_version IS 'Versão dos termos aceitos pelo usuário.';
