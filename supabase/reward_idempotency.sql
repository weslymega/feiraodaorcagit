-- Tabela para rastrear recompensas processadas e garantir idempotência
CREATE TABLE IF NOT EXISTS public.ad_reward_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id TEXT UNIQUE NOT NULL, -- Token único gerado pelo frontend no início do Ad show
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_id UUID NOT NULL REFERENCES public.anuncios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ad_reward_claims ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their own reward claims"
ON public.ad_reward_claims
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Somente o sistema (via Edge Functions com service role) pode inserir registros.
-- Mas vamos liberar o insert para o próprio usuário caso queiramos fazer do frontend, 
-- porém o plano diz que as Edge Functions farão isso por segurança.
-- Para as Edge Functions (Service Role), o RLS é ignorado por padrão.

-- Índice para busca rápida por reward_id
CREATE INDEX IF NOT EXISTS index_ad_reward_claims_reward_id ON public.ad_reward_claims(reward_id);
