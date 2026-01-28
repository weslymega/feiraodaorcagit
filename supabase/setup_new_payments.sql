-- BLINDAGEM DO SISTEMA DE PAGAMENTOS (NOVA ESTRUTURA)
-- Data: 2026-01-28
-- Objetivo: Isolamento total do sistema de destaques com idempotência garantida pelo banco.

-- 1️⃣ Tabela de Pagamentos de Destaque
CREATE TABLE IF NOT EXISTS public.pagamentos_destaque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mercado_pago_payment_id TEXT UNIQUE, -- Unique garante que não haja dois pagamentos iguais processados
    anuncio_id UUID REFERENCES public.anuncios(id) NOT NULL,
    plano_id UUID REFERENCES public.highlight_plans(id) NOT NULL,
    usuario_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    status_detail TEXT,
    valor NUMERIC(10, 2),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index Unique Obrigatório (Reforço)
CREATE UNIQUE INDEX IF NOT EXISTS unique_mp_payment 
ON public.pagamentos_destaque (mercado_pago_payment_id);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_destaque_anuncio ON public.pagamentos_destaque(anuncio_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_destaque_usuario ON public.pagamentos_destaque(usuario_id);

-- 2️⃣ Tabela de Destaques Ativos
CREATE TABLE IF NOT EXISTS public.destaques_anuncios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anuncio_id UUID REFERENCES public.anuncios(id) NOT NULL,
    payment_id UUID REFERENCES public.pagamentos_destaque(id),
    plano_id UUID REFERENCES public.highlight_plans(id) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'scheduled', 'cancelled')),
    inicio_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fim_em TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROTEÇÃO MÁXIMA CONTRA DUPLICIDADE:
-- Impede que um anúncio tenha mais de um destaque 'active' ao mesmo tempo via Database Constraint.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_highlight
ON public.destaques_anuncios (anuncio_id)
WHERE status = 'active';

-- 3️⃣ Tabela de Eventos (Logs Imutáveis)
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id TEXT, -- Pode ser NULL se for erro de payload
    event_type TEXT NOT NULL,
    payload JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions (Adjust as necessary for your service role/anon setup)
ALTER TABLE public.pagamentos_destaque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destaques_anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for Service Role usage in Edge Functions, restricting Client access if needed)
-- Permitir leitura para o dono do anúncio
CREATE POLICY "Users can read own highlight payments" ON public.pagamentos_destaque
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can read own active highlights" ON public.destaques_anuncios
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.anuncios a WHERE a.id = anuncio_id AND a.user_id = auth.uid()
    ));

-- Public visibility for active highlights (so frontend can show badges)
CREATE POLICY "Public can view active highlights" ON public.destaques_anuncios
    FOR SELECT USING (status = 'active');

-- Service Role full access (Implicit generally, but good to explicit if using strict policies)
-- (Supabase default is Service Role bypasses RLS)
