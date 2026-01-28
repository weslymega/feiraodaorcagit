-- 1. Habilitar Replic Identity Full para a tabela messages
-- Isso garante que o payload de UPDATE contenha todos os campos (como ad_id),
-- permitindo que o frontend filtre corretamente quais mensagens recarregar em tempo real.
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Garantir que os campos de privacidade tenham valores padrão para perfis existentes
-- Caso existam perfis criados antes da adição das colunas, eles podem estar NULL.
UPDATE public.profiles SET show_online_status = true WHERE show_online_status IS NULL;
UPDATE public.profiles SET read_receipts = true WHERE read_receipts IS NULL;
