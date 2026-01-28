
-- Tabela para Armazenamento Centralizado de Banners e Promoções
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'dashboard', 'veiculos', 'imoveis', 'pecas_servicos'
    title TEXT NOT NULL,
    subtitle TEXT,
    image TEXT NOT NULL, -- URL ou Base64
    link TEXT,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Política de Leitura Pública
CREATE POLICY "Qualquer pessoa pode visualizar promocoes ativas"
ON public.promotions FOR SELECT
USING (active = true OR (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
)));

-- Política de Escrita Apenas para Admins
CREATE POLICY "Apenas admininstradores podem gerenciar promocoes"
ON public.promotions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;

-- Comentários para documentação
COMMENT ON TABLE public.promotions IS 'Tabela que centraliza os banners de destaque das diferentes telas do app.';
