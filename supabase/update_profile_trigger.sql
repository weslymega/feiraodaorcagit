-- Atualiza o trigger de criação de perfil para incluir aceite de termos com versionamento
-- Garante que se o usuário vier via Registro normal (com metadados), os termos já nasçam aceitos no perfil.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  name_val TEXT;
  avatar_val TEXT;
  accepted_terms_val BOOLEAN;
  accepted_at_val TIMESTAMPTZ;
  terms_accepted_val BOOLEAN;
  terms_version_val TEXT;
BEGIN
  -- Extração segura de metadados
  name_val := COALESCE(
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'full_name', 
    'Usuário'
  );
  
  avatar_val := new.raw_user_meta_data->>'avatar_url';
  
  -- Aceite de termos (Legado)
  accepted_terms_val := COALESCE((new.raw_user_meta_data->>'accepted_terms')::boolean, false);
  
  -- Sincronização de Termos (Novo Sistema V1)
  terms_accepted_val := COALESCE((new.raw_user_meta_data->>'terms_accepted')::boolean, false);
  terms_version_val := new.raw_user_meta_data->>'terms_version';

  IF accepted_terms_val OR terms_accepted_val THEN
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
    terms_accepted,
    terms_accepted_at,
    terms_version,
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
    terms_accepted_val,
    CASE WHEN terms_accepted_val THEN accepted_at_val ELSE NULL END,
    terms_version_val,
    'user',
    0.00
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria perfil do usuário sincronizando metadados de autenticação, incluindo novas colunas de termos v1.';
