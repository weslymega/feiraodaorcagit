-- SOLUÇÃO DEFINITIVA PARA ERRO 409 EM FAVORITOS
-- Este script força a limpeza de qualquer vínculo com a tabela antiga "ads"

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. IDENTIFICAR E REMOVER QUALQUER CONSTRAINT QUE APONTE PARA A TABELA ERRADA
    -- Vamos buscar todas as foreign keys na tabela favorites
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.favorites'::regclass 
        AND contype = 'f' -- Foreign Key
    ) LOOP
        EXECUTE 'ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    END LOOP;

    -- 2. GARANTIR QUE AD_ID É DO TIPO UUID (Necessário para o join com anuncios)
    -- Se a tabela for muito antiga, ad_id pode ser TEXT ou outro tipo.
    BEGIN
        ALTER TABLE public.favorites ALTER COLUMN ad_id TYPE UUID USING ad_id::uuid;
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Não foi possível converter ad_id para UUID. Verifique se os dados são válidos.';
    END;

    -- 3. CRIAR O VÍNCULO CORRETO COM A TABELA ANUNCIOS
    ALTER TABLE public.favorites 
    ADD CONSTRAINT favorites_ad_id_fkey 
    FOREIGN KEY (ad_id) 
    REFERENCES public.anuncios(id) 
    ON DELETE CASCADE;

    -- 4. GARANTIR VÍNCULO COM PROFILES
    BEGIN
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
        ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
        NULL;
    END;

    -- 5. CRIAR ÍNDICE ÚNICO PARA EVITAR DUPLICATAS (Prevenção de 409 no futuro)
    -- Primeiro remove duplicatas existentes usando ctid (Postgres internal ID)
    DELETE FROM public.favorites a USING public.favorites b
    WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.ad_id = b.ad_id;

    DROP INDEX IF EXISTS idx_favorites_user_ad;
    CREATE UNIQUE INDEX idx_favorites_user_ad ON public.favorites (user_id, ad_id);

END $$;

-- 6. RE-HABILITAR RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
CREATE POLICY "Users can add their own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
CREATE POLICY "Users can remove their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);
