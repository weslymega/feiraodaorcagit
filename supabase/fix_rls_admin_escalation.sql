-- =============================================================================
-- PATCH CRÍTICO DE SEGURANÇA — FEIRÃO DA ORCA
-- Arquivo: supabase/fix_rls_admin_escalation.sql
-- Severidade: CRÍTICA — Privilege Escalation via RLS (VUL-01)
--
-- PROBLEMA:
--   Policy "Usuários editam o próprio perfil" estava sem WITH CHECK.
--   Permitia UPDATE profiles SET is_admin = true WHERE id = auth.uid();
--
-- SOLUÇÃO: Implementar WITH CHECK restritivo.
-- =============================================================================

BEGIN;

-- 1. Remover policies vulneráveis
DROP POLICY IF EXISTS "Usuários editam o próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.profiles;

-- 2. Criar nova policy segura
-- USING: Identifica QUEM pode tentar o update (o dono do perfil)
-- WITH CHECK: Identifica O QUE pode ser alterado (campos comuns OK, privilegiados BLOQUEADOS)
CREATE POLICY "secure_profile_update"
ON public.profiles
FOR UPDATE
USING (
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
    
    -- Bloqueio de alteração de campos privilegiados (Imutabilidade via SQL)
    AND is_admin IS NOT DISTINCT FROM (
        SELECT is_admin FROM public.profiles WHERE id = auth.uid()
    )
    AND role IS NOT DISTINCT FROM (
        SELECT role FROM public.profiles WHERE id = auth.uid()
    )
    AND is_blocked IS NOT DISTINCT FROM (
        SELECT is_blocked FROM public.profiles WHERE id = auth.uid()
    )
    AND active_plan IS NOT DISTINCT FROM (
        SELECT active_plan FROM public.profiles WHERE id = auth.uid()
    )
    AND plan_expires_at IS NOT DISTINCT FROM (
        SELECT plan_expires_at FROM public.profiles WHERE id = auth.uid()
    )
);

COMMIT;

-- Verificação:
-- SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'profiles';
