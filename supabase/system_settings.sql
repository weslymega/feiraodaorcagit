
-- 1. Criar a tabela system_settings com padrão Singleton
CREATE TABLE IF NOT EXISTS public.system_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE,
    CONSTRAINT singleton_row CHECK (id = TRUE),
    fair_active BOOLEAN DEFAULT FALSE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acesso
-- SELECT: Público (qualquer usuário logado ou não precisa saber se o app está em manutenção ou na feira)
CREATE POLICY "Leitura pública para configurações do sistema" 
ON public.system_settings FOR SELECT 
USING (true);

-- UPDATE: Apenas Administradores (baseado na coluna is_admin da tabela profiles)
CREATE POLICY "Apenas administradores podem atualizar configurações" 
ON public.system_settings FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- 4. Inserir a linha única inicial
INSERT INTO public.system_settings (id, fair_active, maintenance_mode)
VALUES (TRUE, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. Habilitar Realtime para esta tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
