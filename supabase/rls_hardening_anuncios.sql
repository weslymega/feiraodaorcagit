-- =============================================================================
-- RLS HARDENING CONSOLIDADO — Tabela public.anuncios
-- =============================================================================
-- OBJETIVO: 
--   1. Corrigir vazamento de dados (Visualizacao Publica Total)
--   2. Prevenir Mass Assignment em user_id (Troca de dono)
--   3. Unificar lógica de Admin com public.is_admin()
--   4. Eliminar polices redundantes/conflitantes
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LIMPEZA TOTAL (Idempotência)
-- -----------------------------------------------------------------------------
-- Remove TODAS as policies conhecidas para evitar conflitos de OR/redundância
DROP POLICY IF EXISTS "Users can update own ads"             ON public.anuncios;
DROP POLICY IF EXISTS "Users can update their own ads"       ON public.anuncios;
DROP POLICY IF EXISTS "Allow users to update their own ads"  ON public.anuncios;
DROP POLICY IF EXISTS "Owner can update ad"                  ON public.anuncios;
DROP POLICY IF EXISTS "Admins can update any ad"             ON public.anuncios;
DROP POLICY IF EXISTS "Admins can update all ads"            ON public.anuncios;
DROP POLICY IF EXISTS "Admin update ads"                     ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_update_owner"                ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_update_admin"                ON public.anuncios;
DROP POLICY IF EXISTS "Public view active ads"               ON public.anuncios;
DROP POLICY IF EXISTS "Visualizacao Publica Total"           ON public.anuncios;
DROP POLICY IF EXISTS "Users view own ads"                   ON public.anuncios;
DROP POLICY IF EXISTS "Users insert their own ads"           ON public.anuncios;
DROP POLICY IF EXISTS "Owner can delete ad"                  ON public.anuncios;

-- Nomes novos (para garantir que o script possa ser rodado várias vezes)
DROP POLICY IF EXISTS "anuncios_select_policy"               ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_insert_owner"                ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_delete_policy"               ON public.anuncios;

-- -----------------------------------------------------------------------------
-- 2. HABILITAR RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. POLICIES DE SELECT (Visualização)
-- -----------------------------------------------------------------------------
-- Regra: Pode ver se (é ativo) OU (é o dono) OU (é admin)
CREATE POLICY "anuncios_select_policy"
ON public.anuncios
FOR SELECT
USING (
    (status = 'ativo')                    -- Público (apenas ativos)
    OR (auth.uid() = user_id)             -- Dono (vê rascunhos/pendentes)
    OR (public.is_admin())                -- Admin (vê tudo)
);

-- -----------------------------------------------------------------------------
-- 4. POLICIES DE INSERT (Criação)
-- -----------------------------------------------------------------------------
-- Regra: Pode inserir apenas se o user_id for o seu próprio
CREATE POLICY "anuncios_insert_owner"
ON public.anuncios
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- -----------------------------------------------------------------------------
-- 5. POLICIES DE UPDATE (Edição)
-- -----------------------------------------------------------------------------

-- CAMADA 1: Dono (Restrito)
-- USING: Só tenta atualizar se for dono.
-- WITH CHECK: Só permite o update se o user_id não for alterado (imutabilidade).
CREATE POLICY "anuncios_update_owner"
ON public.anuncios
FOR UPDATE
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- CAMADA 2: Admin (Total)
CREATE POLICY "anuncios_update_admin"
ON public.anuncios
FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    true
);

-- -----------------------------------------------------------------------------
-- 6. POLICIES DE DELETE (Exclusão)
-- -----------------------------------------------------------------------------
-- Regra: Dono ou Admin podem deletar
CREATE POLICY "anuncios_delete_policy"
ON public.anuncios
FOR DELETE
USING (
    (auth.uid() = user_id)
    OR (public.is_admin())
);

-- =============================================================================
-- VERIFICAÇÃO DE SEGURANÇA (Auditoria de Políticas)
-- =============================================================================
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'anuncios';
