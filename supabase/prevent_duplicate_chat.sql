-- 1. Cria a tabela oficial de Conversas
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES public.anuncios(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- A MÁGICA DE BLOQUEIO DO CHAT DUPLICADO AQUI:
    CONSTRAINT unique_chat_per_ad UNIQUE (ad_id, buyer_id)
);

-- 2. Índice para performance
CREATE INDEX IF NOT EXISTS idx_conversations_ad_buyer
ON public.conversations (ad_id, buyer_id);

-- 3. Atualiza a tabela messages para receber a herança secretamente
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- 4. Cria a função de Interceptação Shadow
CREATE OR REPLACE FUNCTION public.sync_conversation_for_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fetched_owner_id UUID;
    calc_buyer_id UUID;
    calc_seller_id UUID;
    target_conversation_id UUID;
BEGIN
    -- Descobrir quem é o dono do anúncio e os papéis
    SELECT user_id INTO fetched_owner_id FROM public.anuncios WHERE id = NEW.ad_id;

    IF NEW.sender_id = fetched_owner_id THEN
        calc_seller_id := NEW.sender_id;
        calc_buyer_id := NEW.receiver_id;
    ELSE
        calc_seller_id := NEW.receiver_id;
        calc_buyer_id := NEW.sender_id;
    END IF;

    -- Tenta criar a Conversa Master de forma ignorante. Se já houver um chat pro casal (via UNIQUE Constraint), ele fará "DO NOTHING" e ignorará a inserção silenciosamente.
    INSERT INTO public.conversations (ad_id, buyer_id, seller_id)
    VALUES (NEW.ad_id, calc_buyer_id, calc_seller_id)
    ON CONFLICT (ad_id, buyer_id) DO NOTHING;

    -- Puxar a ID vitalícia que foi criada agora (ou resgatar a que já existia antes)
    SELECT id INTO target_conversation_id
    FROM public.conversations
    WHERE ad_id = NEW.ad_id AND buyer_id = calc_buyer_id;

    -- Garantir que target_conversation_id nunca fique NULL antes de atribuir
    IF target_conversation_id IS NOT NULL THEN
        NEW.conversation_id := target_conversation_id;
    ELSE
        RAISE EXCEPTION 'Erro ao vincular mensagem: conversation_id nao encontrado ou nulo.';
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Anexar o Trigger
DROP TRIGGER IF EXISTS trigger_sync_conversation ON public.messages;
CREATE TRIGGER trigger_sync_conversation
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.sync_conversation_for_messages();
