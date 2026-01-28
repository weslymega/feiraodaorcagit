-- POLICY: Permitir que o destinatário marque a mensagem como lida (UPDATE is_read)
-- Correção pontual: Sem impacto em produção, compatível com schema atual.

DROP POLICY IF EXISTS "Users can update read status of received messages" ON public.messages;

CREATE POLICY "Users can update read status of received messages" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);
