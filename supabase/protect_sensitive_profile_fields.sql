-- SECURITY MIGRATION: Protect Sensitive Profile Fields
-- Purpose: Prevent unauthorized modification of is_admin, balance, active_plan, and is_blocked.
-- These fields must ONLY be modified by Service Role (Edge Functions) or Admin SQL.

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.protect_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is a regular authenticated user (not service_role or superuser)
    IF (auth.role() = 'authenticated') THEN
        
        -- Check for attempts to change 'is_admin'
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
            RAISE EXCEPTION 'Security Violation: You are not allowed to change admin status directly.';
        END IF;

        -- Check for attempts to change 'balance'
        IF NEW.balance IS DISTINCT FROM OLD.balance THEN
             RAISE EXCEPTION 'Security Violation: Balance updates must use the payment system.';
        END IF;

        -- Check for attempts to change 'active_plan'
        -- Allow updates only if it's the Service Role doing it (which bypasses this check if configured correctly, 
        -- but here we are inside the check for 'authenticated', so this strictly blocks direct user access)
        IF NEW.active_plan IS DISTINCT FROM OLD.active_plan THEN
             RAISE EXCEPTION 'Security Violation: Plan updates must use the subscription system.';
        END IF;

        -- Check for attempts to change 'is_blocked'
        IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
             RAISE EXCEPTION 'Security Violation: You cannot unblock yourself.';
        END IF;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
