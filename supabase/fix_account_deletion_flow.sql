-- =============================================================================
-- FIX: FLUXO DE EXCLUSÃO DE CONTA E UNIFICAÇÃO DE TRIGGERS
-- Arquivo: supabase/fix_account_deletion_flow.sql
-- Objetivo: Permitir DELETE do próprio usuário e consolidar proteção de campos.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. LIMPEZA DE TRIGGERS E FUNÇÕES DUPLICADAS/REDUNDANTES
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS enforce_profile_protection ON public.profiles;
DROP TRIGGER IF EXISTS tr_protect_profile_sensitive_fields ON public.profiles;

DROP FUNCTION IF EXISTS public.protect_sensitive_fields();
DROP FUNCTION IF EXISTS public.protect_profile_sensitive_fields();

-- -----------------------------------------------------------------------------
-- 2. NOVA FUNÇÃO DE PROTEÇÃO CONSOLIDADA (Suporta UPDATE e DELETE separadamente)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Se a operação for DELETE, permitir imediatamente (arquitetura original CASCADE)
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;

    -- 2. Se a operação for UPDATE, aplicar validações de campos sensíveis
    IF (TG_OP = 'UPDATE') THEN
        -- Permitir alterações se disparado pelo service_role (Admin/Backend)
        -- Usamos current_setting('role') ou auth.role() dependendo do contexto, 
        -- mas 'service_role' é o padrão para bypass administrativo no Supabase.
        IF (current_setting('role') = 'service_role') THEN
            RETURN NEW;
        END IF;

        -- Bloquear alteração de campos críticos por usuários comuns
        IF (
            NEW.is_admin IS DISTINCT FROM OLD.is_admin OR 
            NEW.role IS DISTINCT FROM OLD.role OR
            NEW.balance IS DISTINCT FROM OLD.balance OR
            NEW.active_plan IS DISTINCT FROM OLD.active_plan OR
            NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at OR
            NEW.is_blocked IS DISTINCT FROM OLD.is_blocked OR
            (
                -- Verifica existência da coluna deleted_at antes de comparar
                -- (Evita erro caso a coluna não exista no ambiente atual)
                EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at')
                AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
            )
        ) THEN
            RAISE EXCEPTION 'Operação negada: Você não tem permissão para alterar campos administrativos ou financeiros.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 3. CRIAR TRIGGER UNIFICADO
-- -----------------------------------------------------------------------------
CREATE TRIGGER tr_protect_profile_sensitive_v2
    BEFORE UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_sensitive_fields_v2();

-- -----------------------------------------------------------------------------
-- 4. GARANTIR POLÍTICA DE DELETE (RLS)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "User delete own account" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "User delete own account"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

COMMIT;

-- LOG DE SUCESSO
DO $$ BEGIN
    RAISE NOTICE 'Fluxo de exclusão de conta e proteção de perfis atualizado com sucesso.';
END $$;
