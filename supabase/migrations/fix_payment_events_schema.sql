-- Migration to fix payment_events schema mismatch
-- Run this in your Supabase SQL Editor

-- 1. Rename columns if they exist from the old schema
DO $$
BEGIN
  -- Rename payment_id -> mercado_pago_payment_id if it exists
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='payment_events' AND column_name='payment_id') THEN
    ALTER TABLE public.payment_events RENAME COLUMN payment_id TO mercado_pago_payment_id;
  END IF;

  -- Rename payload -> raw_payload if it exists
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='payment_events' AND column_name='payload') THEN
    ALTER TABLE public.payment_events RENAME COLUMN payload TO raw_payload;
  END IF;
END $$;

-- 2. Add missing columns
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS mercado_pago_payment_id text;
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS raw_payload jsonb;
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS source text DEFAULT 'system'; -- Default to system for existing rows
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS processed boolean DEFAULT false;

-- 3. Update comments (optional but good for docs)
COMMENT ON COLUMN public.payment_events.mercado_pago_payment_id IS 'Rastrear eventos por pagamento (Mercado Pago ID).';
COMMENT ON COLUMN public.payment_events.raw_payload IS 'Payload completo JSON recebido do webhook.';
COMMENT ON COLUMN public.payment_events.processed IS 'Indica se o evento disparou lógica de negócio com sucesso.';

-- 4. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON public.payment_events (mercado_pago_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON public.payment_events (created_at DESC);
