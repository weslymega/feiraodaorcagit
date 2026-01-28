-- Configuração de Segurança para Favoritos Existentes

-- 1. Habilitar RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 2. Política de Leitura: Usuários veem apenas seus próprios favoritos
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" 
ON public.favorites FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Política de Inserção: Usuários podem favoritar apenas para si mesmos
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
CREATE POLICY "Users can add their own favorites" 
ON public.favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Política de Exclusão: Usuários podem remover apenas seus próprios favoritos
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
CREATE POLICY "Users can remove their own favorites" 
ON public.favorites FOR DELETE 
USING (auth.uid() = user_id);
