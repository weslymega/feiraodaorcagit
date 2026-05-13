-- Adicionar preferências de notificação ao perfil
alter table public.profiles
add column if not exists push_notifications_enabled boolean default true,
add column if not exists push_chat_enabled boolean default true,
add column if not exists push_ad_status_enabled boolean default true,
add column if not exists push_admin_announcements_enabled boolean default true;

-- Comentários para documentação
comment on column public.profiles.push_notifications_enabled is 'Chave mestre para notificações push';
comment on column public.profiles.push_chat_enabled is 'Notificações de novas mensagens no chat';
comment on column public.profiles.push_ad_status_enabled is 'Notificações de aprovação/reprovação de anúncios';
comment on column public.profiles.push_admin_announcements_enabled is 'Notificações de avisos administrativos globais';
