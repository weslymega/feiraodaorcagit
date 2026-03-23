-- =========================================================================
-- Trigger: prevent_self_chat_on_messages
-- Funcionalidade: Bloqueia a inserção de mensagens onde o remetente
--                 (NEW.sender_id) tenta conversar consigo mesmo.
-- =========================================================================

-- 1. Criar a função que fará a validação
CREATE OR REPLACE FUNCTION public.prevent_self_chat_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Bloqueia apenas se o remetente for igual ao destinatário (auto-conversa)
    IF NEW.sender_id = NEW.receiver_id THEN
        RAISE EXCEPTION 'SELF_CHAT_NOT_ALLOWED';
    END IF;

    -- Caso contrário, permite a inserção normalmente (incluindo donos de anúncios)
    RETURN NEW;
END;
$function$;

-- 2. Garantir que um trigger antigo não exista e criá-lo apenas para INSERT
DROP TRIGGER IF EXISTS prevent_self_chat_trigger ON public.messages;
CREATE TRIGGER prevent_self_chat_trigger
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_chat_fn();
