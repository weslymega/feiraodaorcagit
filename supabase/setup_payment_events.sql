-- ⚠️ CONTEXTO DO PROJETO
-- A tabela principal do sistema é anuncios
-- O sistema de destaque utiliza pagamentos_destaque
-- O projeto já está em produção
-- NÃO pode quebrar nada existente
-- NÃO pode modificar tabelas antigas
-- O sistema precisa ser auditável e antifraude
-- Integração com Mercado Pago

-- 📦 ETAPA 1 — CRIAR TABELA
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mercado_pago_payment_id text,
  event_type text NOT NULL, -- payment | error | duplicate | invalid_signature | etc
  status text, -- approved | rejected | pending | etc
  raw_payload jsonb, -- guardar payload completo recebido
  source text NOT NULL, -- webhook | system | retry
  error_message text, -- armazenar erro se houver
  processed boolean DEFAULT false, -- indica se executou lógica de negócio
  created_at timestamptz DEFAULT now() -- auditoria temporal
);

-- Comentários da Tabela
COMMENT ON TABLE public.payment_events IS 'Immutable log of all payment-related events for audit and anti-fraud.';
COMMENT ON COLUMN public.payment_events.mercado_pago_payment_id IS 'Rastrear eventos por pagamento (Mercado Pago ID).';
COMMENT ON COLUMN public.payment_events.event_type IS 'Tipo do evento: payment, error, duplicate, etc.';
COMMENT ON COLUMN public.payment_events.raw_payload IS 'Payload completo JSON recebido do webhook.';
COMMENT ON COLUMN public.payment_events.processed IS 'Indica se o evento disparou lógica de negócio com sucesso.';

-- 🔐 ETAPA 2 — BLINDAGEM (OBRIGATÓRIA)
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- 1️⃣ Bloquear UPDATE (Explicitamente)
CREATE POLICY "Enforce Immutability - No Updates"
ON public.payment_events
FOR UPDATE
USING (false)
WITH CHECK (false);

-- 2️⃣ Bloquear DELETE (Explicitamente)
CREATE POLICY "Enforce Immutability - No Deletes"
ON public.payment_events
FOR DELETE
USING (false);

-- 3️⃣ Permitir apenas INSERT via service_role
-- Nota: O service_role do Supabase normalmente bypassa o RLS.
-- No entanto, para garantir que NENHUM outro role (anon, authenticated) possa inserir,
-- basta não criar políticas para eles.
-- Se quisermos ser explícitos para o role 'service_role' (caso o bypass esteja desativado ou para documentação):
CREATE POLICY "Allow Service Role Insert Only"
ON public.payment_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- Política para leitura (SELECT) - Opcional, dependendo se o admin precisa ler via dashboard
-- Por padrão, ninguém além do service_role consegue ler se não houver policy.
-- Vamos liberar leitura apenas para service_role por enquanto para segurança máxima.
CREATE POLICY "Allow Service Role Select Only"
ON public.payment_events
FOR SELECT
TO service_role
USING (true);

-- 📊 ETAPA 3 — ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id
ON public.payment_events (mercado_pago_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_created_at
ON public.payment_events (created_at DESC);

-- 🧠 ETAPA 4 — BOAS PRÁTICAS (Documentação no SQL)
-- Nunca atualizar registros
-- Nunca sobrescrever logs
-- Cada evento gera uma nova linha
-- Não usar upsert
