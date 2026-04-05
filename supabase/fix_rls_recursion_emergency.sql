-- =============================================================================
-- EMERGENCY FIX: RLS INFINITE RECURSION
-- Arquivo: supabase/fix_rls_recursion_emergency.sql
-- Severidade: CRÍTICA
-- =============================================================================

BEGIN;

-- 1. IDENTIFICAR E REMOVER POLICIES PROBLEMÁTICAS
-- Remove todas as políticas que possam estar causando a recursão infinita no profiles
DROP POLICY IF EXISTS "admin_view_all" ON public.profiles;
DROP POLICY IF EXISTS "secure_profile_update" ON public.profiles;
DROP POLICY IF EXISTS "view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles são públicos" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários editam o próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.profiles;

-- 2. RESTAURAR FUNCIONAMENTO MÍNIMO (SAFE MODE)
-- Garantimos que a tabela profiles tenha RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT (usuário vê apenas o próprio perfil)
-- Esta política é segura pois não faz queries na própria tabela profiles
CREATE POLICY "view_own_profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- UPDATE (usuário edita apenas o próprio perfil)
-- Esta política é segura pois não faz queries na própria tabela profiles
CREATE POLICY "update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. ADMIN ACCESS (VIA SERVICE_ROLE)
-- Por enquanto, não implementamos acesso admin via RLS para evitar recursão.
-- Admins devem acessar via Edge Functions usando service_role_key.

COMMIT;

-- 4. VERIFICAÇÃO DE ERRO
-- Execute: SELECT * FROM profiles WHERE id = auth.uid();
-- Não deve haver erro de 'infinite recursion'.
