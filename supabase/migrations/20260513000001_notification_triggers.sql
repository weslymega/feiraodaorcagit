-- Configuração de Triggers para Notificações Push

-- 1. Função para Notificação de Chat
-- Recomendação: Ativar via Supabase Dashboard > Database > Webhooks para melhor performance.
-- Esta trigger é mantida como backup/lógica documentada.

create or replace function public.handle_new_chat_notification()
returns trigger
security definer
language plpgsql
as $$
begin
  -- A lógica de disparo real deve ser configurada no Supabase Webhooks
  -- para evitar latência na transação de INSERT da mensagem.
  return new;
end;
$$;

-- 2. Notificações de Admin (Aprovação/Reprovação)
create or replace function public.handle_ad_status_notification()
returns trigger
security definer
language plpgsql
as $$
begin
  -- Disparar apenas se o status mudar para Ativo ou Rejeitado
  if (old.status is distinct from new.status) and (new.status in ('active', 'rejected', 'ativo', 'rejeitado')) then
    -- Aqui o webhook deve ser disparado com o tipo 'ad_status_change'
  end if;
  return new;
end;
$$;
