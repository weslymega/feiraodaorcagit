-- 🛡️ TABELA DE DENÚNCIAS (reports) - RESET & REFORMA TOTAL ⚖️

-- ⚠️ ATENÇÃO: Este script APAGA e RECIRIA a tabela reports.
-- Isso é necessário para corrigir os tipos das colunas (ad_id de UUID para TEXT)
-- e adicionar as novas colunas obrigatórias para o sistema funcionar com dados Mock.

DROP TABLE IF EXISTS public.reports;

CREATE TABLE public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) NOT NULL,
    
    -- Colunas de alvo flexíveis (aceitam UUID ou TEXTO para Mocks)
    ad_id TEXT, 
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('ad', 'user')),
    
    -- Novas colunas robustas para evitar joins complexos
    target_name TEXT, 
    target_image TEXT, 
    reported_user_id UUID, -- Opcional, pois pode ser um user mockado
    
    reason TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- 🔒 SEGURANÇA (RLS) 🛡️

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer usuário autenticado pode criar denúncias
CREATE POLICY "Users can insert reports" ON public.reports 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Somente administradores podem ver todas as denúncias
CREATE POLICY "Admins can view and manage all reports" ON public.reports 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Confirmação visual
SELECT 'Tabela reports recriada com sucesso!' as status;
