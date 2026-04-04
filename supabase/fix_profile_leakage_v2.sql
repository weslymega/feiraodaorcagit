-- =============================================================================
-- HARDENING DE PRIVACIDADE: PERFIS (profiles)
-- Arquivo: supabase/fix_profile_leakage_v2.sql
-- Severidade: CRÍTICA — Data Leakage (LGPD)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. LIMPEZA DE POLICIES VULNERÁVEIS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles são públicos" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- -----------------------------------------------------------------------------
-- 2. BLOQUEIO DA TABELA PRINCIPAL (profiles)
-- -----------------------------------------------------------------------------

-- Apenas o próprio usuário vê seu perfil completo (email, saldo, etc)
CREATE POLICY "view_own_profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins vêm tudo (Fonte de verdade no Banco)
CREATE POLICY "admin_view_all"
ON public.profiles
FOR SELECT
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- -----------------------------------------------------------------------------
-- 3. CRIAÇÃO DA CAMADA PÚBLICA (VIEW)
-- -----------------------------------------------------------------------------

-- Criamos uma VIEW que expõe apenas colunas SEGURAS para o marketplace.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  name,
  avatar_url,
  bio,
  location,
  created_at -- Útil para mostrar "No Feirão desde..."
FROM public.profiles;

-- -----------------------------------------------------------------------------
-- 4. PERMISSÕES DA VIEW
-- -----------------------------------------------------------------------------
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMIT;

-- -----------------------------------------------------------------------------
-- VERIFICAÇÃO FINAL
-- -----------------------------------------------------------------------------
-- 1. SELECT * FROM profiles; (Como anon/user -> Deve vir filtrado)
-- 2. SELECT * FROM public_profiles; (Como anon/user -> Deve vir OK)
