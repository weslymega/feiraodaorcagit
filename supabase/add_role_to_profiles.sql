-- 🔹 Etapa 1 — Ajuste no Banco
-- Adicionar coluna role na tabela profiles e migrar admins existentes

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Migrar usuários que já eram admins para a nova coluna
UPDATE public.profiles SET role = 'admin' WHERE is_admin = true;

-- Comentário: A partir de agora, o sistema deve priorizar a coluna 'role' para verificações de segurança.
