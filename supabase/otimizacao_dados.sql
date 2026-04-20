-- Extensão necessária para busca textual otimizada por substring (trigramas)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Índices para Colunas Principais (Filtro e Ordenação)
CREATE INDEX IF NOT EXISTS idx_anuncios_categoria ON public.anuncios (categoria);
CREATE INDEX IF NOT EXISTS idx_anuncios_created_at ON public.anuncios (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anuncios_preco ON public.anuncios (preco);
CREATE INDEX IF NOT EXISTS idx_anuncios_status ON public.anuncios (status);

-- 2. Índices para Campos Específicos dentro do JSONB (B-Tree Expression)
CREATE INDEX IF NOT EXISTS idx_anuncios_detalhes_marca ON public.anuncios ((detalhes->>'brandName'));
CREATE INDEX IF NOT EXISTS idx_anuncios_detalhes_modelo ON public.anuncios ((detalhes->>'modelName'));
CREATE INDEX IF NOT EXISTS idx_anuncios_detalhes_ano ON public.anuncios (((detalhes->>'year')::int));

-- 3. Busca Textual Otimizada (GIN Trigrama)
-- DROP INDEX IF EXISTS idx_anuncios_titulo_trgm; -- Rodar manualmente se já existir GIST
CREATE INDEX IF NOT EXISTS idx_anuncios_titulo_trgm ON public.anuncios USING gin (titulo gin_trgm_ops);

-- 4. Índice para Destaques/Turbo (Estático e Otimizado)
-- DROP INDEX IF EXISTS idx_anuncios_turbo_expires; -- Rodar manualmente se já existir com NOW()
CREATE INDEX IF NOT EXISTS idx_anuncios_turbo_expires ON public.anuncios (turbo_expires_at) WHERE turbo_expires_at IS NOT NULL;

/* 
  VALIDAÇÃO DE PERFORMANCE (Rodar no SQL Editor do Supabase)
  
  -- Teste 1: Busca Textual (Deve usar 'Index Scan using idx_anuncios_titulo_trgm')
  EXPLAIN ANALYZE SELECT id, titulo FROM public.anuncios WHERE titulo ILIKE '%civic%';
  
  -- Teste 2: Destaques Ativos (Deve usar 'Bitmap Heap Scan using idx_anuncios_turbo_expires')
  EXPLAIN ANALYZE SELECT id, titulo FROM public.anuncios WHERE turbo_expires_at > NOW();
*/
