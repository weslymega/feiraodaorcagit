
-- =============================================================================
-- MIGRATION: SISTEMA DE AVATARES ANIMADOS
-- Descrição: Adiciona suporte a avatares fixos da biblioteca oficial.
-- =============================================================================

BEGIN;

-- 1. Adicionar coluna à tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_id text;

-- 2. Atualizar a View Pública para expor o avatar_id
-- O uso de CASCADE garante que se houver dependências (raro), elas sejam tratadas,
-- mas aqui recriamos a permissão logo em seguida.
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  name,
  avatar_url,
  avatar_id,  -- Novo campo exposto
  bio,
  location,
  created_at
FROM public.profiles;

-- 3. Restaurar permissões da VIEW
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 4. Atualizar o Trigger de Novos Usuários (Opcional: Suporte a metadados iniciais)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, avatar_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário'), 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'avatar_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- VERIFICAÇÃO 
-- SELECT avatar_id FROM public_profiles LIMIT 1; -- Deve funcionar sem erro
