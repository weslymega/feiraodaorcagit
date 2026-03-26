-- 🛡️ TABELA DE BLOQUEIOS (user_blocks) ⚖️

CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Impedir auto-bloqueio e duplicidade
    CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id),
    UNIQUE(blocker_id, blocked_id)
);

-- 🔒 SEGURANÇA (RLS) 🛡️

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- 1. Usuário pode ver apenas seus próprios registros de bloqueio
CREATE POLICY "Users can view their own blocks" ON public.user_blocks
FOR SELECT USING (auth.uid() = blocker_id);

-- 2. Usuário pode bloquear outros
CREATE POLICY "Users can insert their own blocks" ON public.user_blocks
FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- 3. Usuário pode desbloquear (deletar)
CREATE POLICY "Users can delete their own blocks" ON public.user_blocks
FOR DELETE USING (auth.uid() = blocker_id);

-- 🚨 ENFORCEMENT EM OUTRAS TABELAS (HARDENING) 🚨

-- A. BLOQUEIO DE MENSAGENS (Não permitir INSERT se houver bloqueio)
-- Nota: Isso exige que a tabela messages tenha sender_id e receiver_id claros.
-- Como as mensagens estão em 'messages', vamos adicionar uma política de restrição.

CREATE POLICY "Block messages between blocked users" ON public.messages
FOR INSERT WITH CHECK (
    NOT EXISTS (
        SELECT 1 FROM public.user_blocks 
        WHERE (blocker_id = auth.uid() AND blocked_id = receiver_id)
           OR (blocker_id = receiver_id AND blocked_id = auth.uid())
    )
);

-- B. FILTRAGEM DE ANÚNCIOS (SELECT)
-- Usuários não devem ver anúncios de quem os bloqueou ou de quem eles bloquearam.

CREATE POLICY "Hide ads from/to blocked users" ON public.anuncios
FOR SELECT USING (
    NOT EXISTS (
        SELECT 1 FROM public.user_blocks 
        WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
           OR (blocker_id = user_id AND blocked_id = auth.uid())
    )
);

-- C. FILTRAGEM DE CHATS/CONVERSAS (SELECT)
-- Ocultar conversas se houver bloqueio bidirecional.

CREATE POLICY "Hide chats with blocked users" ON public.chats
FOR SELECT USING (
    NOT EXISTS (
        SELECT 1 FROM public.user_blocks 
        WHERE (blocker_id = auth.uid() AND (blocked_id = buyer_id OR blocked_id = seller_id))
           OR ((blocker_id = buyer_id OR blocker_id = seller_id) AND blocked_id = auth.uid())
    )
);
