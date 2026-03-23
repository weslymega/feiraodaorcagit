-- =========================================================================
-- MIGRATION: Chat Message & Image Limits
-- =========================================================================

-- 1. Adicionar coluna images (JSONB) se não existir
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS images JSONB;

-- 2. Constraint de tamanho total do texto (500 caracteres)
-- Nota: PostgreSQL permite adicionar constraints desse tipo em tabelas existentes.
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_content_length_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_content_length_check CHECK (char_length(content) <= 500);

-- 3. Função de Validação de Limites (Texto e Imagens)
CREATE OR REPLACE FUNCTION public.validate_message_limits_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    word_count int;
    word_item text;
BEGIN
    -- A REGRA: NÃO exigir texto obrigatório (pode ser só imagem)
    -- Validação de Texto (Apenas se content existir)
    IF NEW.content IS NOT NULL AND trim(NEW.content) <> '' THEN
        -- Contagem de palavras usando regex (mesma lógica do frontend)
        -- trim garante que espaços no início/fim não contem como palavras vazias
        word_count := array_length(regexp_split_to_array(trim(NEW.content), '\s+'), 1);
        
        IF word_count > 50 THEN
            RAISE EXCEPTION 'MESSAGE_TOO_LONG';
        END IF;

        -- Validação de tamanho de cada palavra (Máximo 30 caracteres)
        FOR word_item IN SELECT unnest(regexp_split_to_array(trim(NEW.content), '\s+'))
        LOOP
            IF char_length(word_item) > 30 THEN
                RAISE EXCEPTION 'WORD_TOO_LONG';
            END IF;
        END LOOP;
    END IF;

    -- Validação de Imagens (JSONB)
    -- A REGRA: Máximo de 3 imagens por mensagem
    IF NEW.images IS NOT NULL THEN
        IF jsonb_array_length(NEW.images) > 3 THEN
            RAISE EXCEPTION 'TOO_MANY_IMAGES';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Criar Trigger de Validação (Fira antes do insert ou update)
DROP TRIGGER IF EXISTS trigger_validate_message_limits ON public.messages;
CREATE TRIGGER trigger_validate_message_limits
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_limits_fn();
