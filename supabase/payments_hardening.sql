-- BLINDAGEM DO SISTEMA DE PAGAMENTOS (CORRIGIDO)
-- Autor: Antigravity
-- Data: 2026-01-28

-- 0. Garantir que a coluna is_admin existe na tabela profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 1. Tabela de Eventos de Pagamento (Auditoria Completa - Raw Webhooks)
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mp_payment_id TEXT, -- ID do pagamento no Mercado Pago (se extraível)
    event_type TEXT, -- Tipo do evento (payment.created, payment.updated, etc)
    payload JSONB NOT NULL, -- O JSON completo recebido do webhook
    headers JSONB, -- Headers da requisição para debug
    processing_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'error', 'ignored'
    processed_at TIMESTAMPTZ, -- Data do processamento com sucesso
    error_details TEXT, -- Detalhes do erro se houver falha
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por payment_id
CREATE INDEX IF NOT EXISTS idx_payment_events_mp_id ON public.payment_events(mp_payment_id);
-- Index para monitoramento de erros
CREATE INDEX IF NOT EXISTS idx_payment_events_status ON public.payment_events(processing_status);

-- 2. Hardening da Tabela Payments
-- Adicionar Constraints se não existirem (Safe Alter)

DO $$ 
BEGIN 
    -- Adicionar check constraint para status se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_status_check') THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_status_check 
        CHECK (status IN ('pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back'));
    END IF;
END $$;

-- Garantir índices críticos
CREATE INDEX IF NOT EXISTS idx_payments_mp_id ON public.payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ad_id ON public.payments(ad_id);

-- 3. RLS para Payment Events (Apenas Admins podem ver)
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admins podem ver eventos de pagamento" ON public.payment_events;
CREATE POLICY "Apenas admins podem ver eventos de pagamento" ON public.payment_events
    FOR ALL
    USING (
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) IS TRUE
    );
