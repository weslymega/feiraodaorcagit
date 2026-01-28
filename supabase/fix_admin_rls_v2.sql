-- 1. Create a Secure Function to check Admin Status
-- This function runs as SECURITY DEFINER, meaning it bypasses RLS on the profiles table
-- to strictly check if the user is an admin, preventing recursion issues.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all ads" ON public.anuncios;

-- 3. Create the new Robust Policy
CREATE POLICY "Admins can view all ads"
ON public.anuncios
FOR SELECT
USING (
  public.is_admin()
);

-- 4. Ensure RLS is enabled
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
