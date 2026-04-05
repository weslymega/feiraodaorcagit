-- =============================================================================
-- HARDENING DE PRIVACIDADE E SEGURANÇA: PERFIS (profiles)
-- Arquivo: supabase/fix_profile_leakage_v2.sql
-- Severidade: CRÍTICA — Data Leakage & Privilege Escalation (VUL-02)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. LIMPEZA DE POLICIES VULNERÁVEIS (Remove versões recursivas/antigas)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles são públicos" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_view_all" ON public.profiles;
DROP POLICY IF EXISTS "secure_profile_update" ON public.profiles;
DROP POLICY IF EXISTS "view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

-- -----------------------------------------------------------------------------
-- 2. POLÍTICAS DE RLS (SAFE MODE — SEM RECURSÃO)
-- -----------------------------------------------------------------------------

-- Apenas o próprio usuário vê seu perfil completo (email, saldo, etc)
CREATE POLICY "view_own_profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Apenas o usuário pode editar o próprio perfil
-- Nota: WITH CHECK garante que o usuário continue sendo o dono do registro após o edit.
CREATE POLICY "update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 3. TRIGGER DE PROTEÇÃO (ADMIN & FINANCIAL PROTECTION)
-- Impede que usuários comuns alterem campos sensíveis via código/RLS.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o comando NÃO for disparado pelo service_role (backend/admin)
  -- Bloqueamos a alteração de colunas críticas
  IF (current_setting('role') != 'service_role') THEN
    IF (
      NEW.is_admin IS DISTINCT FROM OLD.is_admin OR 
      NEW.role IS DISTINCT FROM OLD.role OR
      NEW.balance IS DISTINCT FROM OLD.balance OR
      NEW.active_plan IS DISTINCT FROM OLD.active_plan OR
      NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at OR
      NEW.is_blocked IS DISTINCT FROM OLD.is_blocked OR
      NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    ) THEN
      RAISE EXCEPTION 'Operação negada: Você não tem permissão para alterar campos administrativos ou financeiros.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_sensitive_fields();

-- -----------------------------------------------------------------------------
-- 4. CAMADA PÚBLICA (VIEW)
-- Expõe apenas colunas SEGURAS para o marketplace sem expor dados financeiros.
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  name,
  avatar_url,
  bio,
  location,
  created_at
FROM public.profiles;

-- Permissões da VIEW
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMIT;

-- -----------------------------------------------------------------------------
-- VERIFICAÇÃO FINAL
-- -----------------------------------------------------------------------------
-- 1. SELECT * FROM profiles WHERE id = auth.uid(); (Deve retornar 1 linha OK)
-- 2. UPDATE profiles SET is_admin = true WHERE id = auth.uid(); (Deve dar ERRO)
-- 3. SELECT * FROM public_profiles; (Deve retornar colunas seguras OK)
