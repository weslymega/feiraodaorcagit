-- Script de Alinhamento: Favoritos -> Anuncios
-- Este script corrige o erro 409/23503 ao favoritar itens.

DO $$ 
BEGIN
    -- 1. Remover a restrição antiga que aponta para a tabela "ads" (legada)
    -- O erro do console confirmou que a FK "favorites_ad_id_fkey" está tentando validar contra "ads".
    BEGIN
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_ad_id_fkey;
    EXCEPTION WHEN others THEN
        NULL;
    END;

    -- 2. Adicionar a nova restrição apontando para "anuncios" (tabela correta do sistema)
    BEGIN
        ALTER TABLE public.favorites 
        ADD CONSTRAINT favorites_ad_id_fkey 
        FOREIGN KEY (ad_id) 
        REFERENCES public.anuncios(id) 
        ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Não foi possível adicionar a constraint. Verifique se a tabela anuncios existe e se ad_id tem o tipo correto (UUID).';
    END;

END $$;

-- 3. Garantir Políticas de RLS (Re-aplicação para segurança)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" 
ON public.favorites FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
CREATE POLICY "Users can add their own favorites" 
ON public.favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
CREATE POLICY "Users can remove their own favorites" 
ON public.favorites FOR DELETE 
USING (auth.uid() = user_id);
