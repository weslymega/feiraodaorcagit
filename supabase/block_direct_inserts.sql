-- =============================================================================
-- SECURITY FIX: BLOCK DIRECT INSERTS IN ANUNCIOS
-- =============================================================================
-- PROBLEMA: Usuários podiam inserir anúncios diretamente na tabela via client REST,
--           burlando os limites de anúncios estabelecidos pela Edge Function `create_ad`.
--
-- SOLUÇÃO: Remover qualquer RLS policy de INSERT na tabela `anuncios` que permita
--          o "authenticated" user de inserir dados diretamente. Ao fazer isso, o 
--          insert direto retornará 403.
--          O Edge Function `create_ad` usa a `service_role` key, a qual ignora
--          RLS e continuará a inserir os registros de forma segura após as validações.
-- =============================================================================

-- Remover policy anterior criada no fix_anuncios_insert_rls.sql ou similares
DROP POLICY IF EXISTS "anuncios_insert_owner" ON public.anuncios;
DROP POLICY IF EXISTS "Users can insert own ads" ON public.anuncios;
DROP POLICY IF EXISTS "Authenticated users can insert ads" ON public.anuncios;

-- Certificar que não há nenhuma nova permissão sendo dada.
-- Não criar nenhuma permissão de INSERT para não-admins ou não-service_roles.

-- Garantir que o service_role possa inserir (apesar do service_role bypassar RLS por default, 
-- é boa prática ter explícito caso Bypass RLS não esteja configurado, embora padrão do Supabase seja bypass)
-- Apenas para segurança, não é necessário fazer nada pois o service_role bypassa.
