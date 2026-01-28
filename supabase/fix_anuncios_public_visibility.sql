-- ENFORCE PUBLIC VISIBILITY LIMITS
-- Data: 2026-01-28
-- Objetivo: Garantir que apenas anúncios com status 'ativo' sejam visíveis publicamente.

-- 1. Remover políclica antiga de visualização pública se existir
DROP POLICY IF EXISTS "Public view active ads" ON public.anuncios;
DROP POLICY IF EXISTS "Public view active ads" ON public.ads; -- Fallback for naming variations

-- 2. Criar políclica restrita
CREATE POLICY "Public view active ads" 
ON public.anuncios FOR SELECT 
USING (status = 'ativo');

-- 3. Certificar que RLS está habilitado
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

-- 4. Re-garantir que donos vejam seus próprios anúncios (independente de status)
DROP POLICY IF EXISTS "Users view own ads" ON public.anuncios;
CREATE POLICY "Users view own ads" 
ON public.anuncios FOR SELECT 
USING (auth.uid() = user_id);
