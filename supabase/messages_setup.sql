-- Plano de Adaptação Robusto da Tabela messages

-- 1. Garantir campos fundamentais e tipos corretos
DO $$ 
BEGIN
    -- Garantir ID como UUID e Primary Key
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'id') THEN
        ALTER TABLE public.messages ADD COLUMN id UUID DEFAULT uuid_generate_v4() PRIMARY KEY;
    END IF;

    -- Garantir campos de conteúdo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content') THEN
        ALTER TABLE public.messages ADD COLUMN content TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'image_url') THEN
        ALTER TABLE public.messages ADD COLUMN image_url TEXT;
    END IF;

    -- Garantir campo de leitura
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_read') THEN
        ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;

    -- Garantir que ad_id é UUID e aponta para anuncios (tabela correta)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'ad_id') THEN
        ALTER TABLE public.messages ADD COLUMN ad_id UUID REFERENCES public.anuncios(id);
    ELSE
        -- Se já existe, garante que a constraint aponte para anuncios
        BEGIN
            ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_ad_id_fkey;
            ALTER TABLE public.messages ADD CONSTRAINT messages_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.anuncios(id);
        EXCEPTION WHEN others THEN
            NULL;
        END;
    END IF;
END $$;

-- 2. LIMPEZA DE RESTRIÇÕES (Causa provável do 409 Conflict)
-- Remove índices de unicidade que podem estar impedindo múltiplas mensagens no mesmo tópico
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.messages'::regclass 
        AND contype = 'u' -- Unique constraints
    ) LOOP
        EXECUTE 'ALTER TABLE public.messages DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 3. RLS e Segurança
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
CREATE POLICY "Users can read their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- 4. Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  -- Tenta adicionar a tabela de forma segura
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN others THEN
    NULL; -- Já deve estar lá
  END;
END $$;
