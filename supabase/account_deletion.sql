
-- 1. Adicionar coluna para Soft Delete
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Criar RPC para Deleção Segura (Soft Delete + Block)
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Pegar o ID do usuário autenticado que está chamando a função
  target_user_id := auth.uid();

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  -- A. Soft Delete no Perfil + Bloqueio
  UPDATE public.profiles
  SET 
    deleted_at = NOW(),
    is_blocked = true,
    full_name = 'Usuário Excluído',
    avatar_url = NULL,
    bio = 'Esta conta foi encerrada pelo usuário.'
  WHERE id = target_user_id;

  -- B. Desativar Anúncios Ativos (Não deletar, apenas desativar)
  UPDATE public.ads
  SET status = 'Inativo'
  WHERE user_id = target_user_id AND status = 'Ativo';

  -- C. Registro de log (opcional, se houver tabela de logs)
  -- INSERT INTO public.audit_logs (user_id, action) VALUES (target_user_id, 'account_deletion_requested');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
