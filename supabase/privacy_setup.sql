-- Etapa 1: Configuração de Privacidade no Banco de Dados

-- 1. Adicionar colunas explícitas para privacidade
-- Usamos colunas booleanas diretas para simplicidade e performance.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS read_receipts BOOLEAN DEFAULT true;

-- 2. Garantir que o RLS permita a atualização pelo próprio usuário
-- Criamos uma política específica de UPDATE para o proprietário do perfil.
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.profiles;
CREATE POLICY "Users can update their own privacy settings" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- NOTA: Como o usuário pediu para atualizar APENAS campos de privacidade no código,
-- a política de banco de dados permitirá o update geral para o dono, 
-- mas a restrição será aplicada na camada de aplicação (API).
