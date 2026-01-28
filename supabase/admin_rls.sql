-- Policy for Admins to view ALL ads (Pending, Rejected, Active)
-- Assumes admin is defined by metadata or a specific claim/table lookup.
-- Adjust 'is_admin' logic to match your auth system (e.g. public.profiles.role or auth.jwt() metadata)

-- 1. Create a helper function if not exists to check admin status (Optional but cleaner)
-- OR use a direct check in the policy.
-- Using Direct Check against public.profiles for simplicity based on your project structure.

create policy "Admins can view all ads"
on public.anuncios
for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);
