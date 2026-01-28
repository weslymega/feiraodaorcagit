-- SECURITY MIGRATION: Protect Sensitive Profile Fields
-- Purpose: Prevent unauthorized modification of is_admin, balance, active_plan, and is_blocked.
-- These fields must ONLY be modified by Service Role (Edge Functions) or Admin SQL.

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.protect_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role text;
BEGIN
    -- 1. Se role for 'service_role' (Edge Functions / Admin), permitir tudo.
    IF (auth.role() = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- 2. Buscar o role do usuário atual no banco de dados.
    -- Usamos auth.uid() para garantir que a verificação é baseada no usuário logado.
    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE id = auth.uid();

    -- 3. Se o usuário NÃO for 'admin', bloquear alteração de campos sensíveis.
    -- Usamos COALESCE para tratar casos onde o user pode não ter role definido (default 'user').
    IF COALESCE(v_user_role, 'user') != 'admin' THEN
        
        -- Bloqueio de 'role'
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Security Violation: Cannot change role directly.';
        END IF;

        -- Bloqueio de 'is_admin'
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
            RAISE EXCEPTION 'Security Violation: Cannot change admin status directly.';
        END IF;

        -- Bloqueio de 'balance'
        IF NEW.balance IS DISTINCT FROM OLD.balance THEN
            RAISE EXCEPTION 'Security Violation: Balance updates must use the payment system.';
        END IF;

        -- Bloqueio de 'active_plan'
        IF NEW.active_plan IS DISTINCT FROM OLD.active_plan THEN
            RAISE EXCEPTION 'Security Violation: Plan updates must use the subscription system.';
        END IF;

        -- Bloqueio de 'is_blocked'
        IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
            RAISE EXCEPTION 'Security Violation: You cannot unblock or block users directly.';
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS enforce_profile_protection ON public.profiles;

CREATE TRIGGER enforce_profile_protection
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_sensitive_fields();

-- Confirmation log (optional, mostly for manual run visual feedback)
DO $$
BEGIN
    RAISE NOTICE 'Security Trigger enforce_profile_protection created successfully.';
END $$;
