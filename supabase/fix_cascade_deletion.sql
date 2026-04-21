-- SCRIPT DE LIBERAÇÃO DE LIMPEZA (CASCADE DELETE)
-- Este script permite que anúncios sejam excluídos mesmo se houverem mensagens ou pagamentos vinculados.

BEGIN;

-- 1. Ajustar Tabela de Mensagens
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_ad_id_fkey,
ADD CONSTRAINT messages_ad_id_fkey 
    FOREIGN KEY (ad_id) 
    REFERENCES public.anuncios(id) 
    ON DELETE CASCADE;

-- 2. Ajustar Tabela de Pagamentos
ALTER TABLE public.pagamentos_destaque
DROP CONSTRAINT IF EXISTS pagamentos_destaque_anuncio_id_fkey,
ADD CONSTRAINT pagamentos_destaque_anuncio_id_fkey 
    FOREIGN KEY (anuncio_id) 
    REFERENCES public.anuncios(id) 
    ON DELETE CASCADE;

COMMIT;

-- Verificação
DO $$ 
BEGIN 
    RAISE NOTICE 'Constraints atualizadas com ON DELETE CASCADE com sucesso.';
END $$;
