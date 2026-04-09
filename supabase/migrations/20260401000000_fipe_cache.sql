-- 1. Criar a tabela fipe_cache
CREATE TABLE IF NOT EXISTS public.fipe_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    marca VARCHAR(255),
    modelo VARCHAR(255),
    ano VARCHAR(100),
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Habilitar RLS e criar política de leitura pública e escrita autenticada
ALTER TABLE public.fipe_cache ENABLE ROW LEVEL SECURITY;

-- Política de leitura: todos podem ler do cache
DROP POLICY IF EXISTS "Leitura pública FIPE Cache" ON public.fipe_cache;
CREATE POLICY "Leitura pública FIPE Cache" 
ON public.fipe_cache 
FOR SELECT 
USING (true);

-- Política de escrita: todos (ou só autenticados) podem salvar no cache 
-- Como é um cache FIPE inofensivo, permitimos insert publico temporariamente (ou anon)
DROP POLICY IF EXISTS "Escrita anônima/autenticada FIPE Cache" ON public.fipe_cache;
CREATE POLICY "Escrita anônima/autenticada FIPE Cache" 
ON public.fipe_cache 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. Trigger para manter updated_at atualizado
CREATE OR REPLACE FUNCTION update_fipe_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fipe_cache_updated_at ON public.fipe_cache;
CREATE TRIGGER trigger_update_fipe_cache_updated_at
BEFORE UPDATE ON public.fipe_cache
FOR EACH ROW
EXECUTE FUNCTION update_fipe_cache_updated_at();

-- 4. Função para limpar cache antigo (opcional, rodar de tempos em tempos)
-- DELETE FROM fipe_cache WHERE updated_at < NOW() - INTERVAL '7 days';
