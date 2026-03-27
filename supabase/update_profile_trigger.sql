-- Atualiza o trigger de criação de perfil para incluir aceite de termos
-- Garante que se o usuário vier via Registro normal (com metadados), os termos já nasçam aceitos no perfil.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  name_val TEXT;
  avatar_val TEXT;
  accepted_terms_val BOOLEAN;
  accepted_at_val TIMESTAMPTZ;
BEGIN
  -- Extração segura de metadados
  name_val := COALESCE(
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'full_name', 
    'Usuário'
  );
  
  avatar_val := new.raw_user_meta_data->>'avatar_url';
  
  -- Aceite de termos (vindo do Registro ou Social com flag preemptiva)
  accepted_terms_val := COALESCE((new.raw_user_meta_data->>'accepted_terms')::boolean, false);
  
  IF accepted_terms_val THEN
    accepted_at_val := COALESCE((new.raw_user_meta_data->>'accepted_at')::timestamptz, NOW());
  ELSE
    accepted_at_val := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    avatar_url,
    accepted_terms,
    accepted_at,
    role,
    balance
  )
  VALUES (
    new.id, 
    new.email, 
    name_val, 
    avatar_val,
    accepted_terms_val,
    accepted_at_val,
    'user',
    0.00
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria ou atualiza perfil do usuário sincronizando metadados de autenticação, incluindo aceite de termos.';
