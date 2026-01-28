-- =============================================================================
-- ETAPA 3: RLS HARDENING — tabela public.anuncios
-- =============================================================================
-- OBJETIVO: Reescrever policies FOR UPDATE com USING + WITH CHECK
--           para bloquear troca de user_id e updates em anúncios de terceiros.
--
-- TABELA CONFIRMADA: public.anuncios
--   (verificado em fix_admin_rls_v2.sql linha 18 e 100% do código TypeScript)
--
-- NOTA IMPORTANTE: O arquivo protect_ads_fields.sql (ETAPA 2) usou 'public.ads'
--   por engano. O trigger da ETAPA 2 deve ser REAPLICADO em public.anuncios
--   se ainda não estiver. Este script NÃO modifica triggers.
--
-- ARQUITETURA DE DEFESA (após ETAPA 3):
--   User Request → RLS (USING + WITH CHECK) → Trigger BEFORE UPDATE → Database
--
-- VERIFICAÇÃO DE DEPENDÊNCIA:
--   Requer: public.is_admin() (SECURITY DEFINER, criada em fix_admin_rls_v2.sql)
--
-- DATA: 2026-01-28
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PASSO 0: Garantir que RLS está habilitado (idempotente)
-- -----------------------------------------------------------------------------
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PASSO 1: Remover TODAS as policies UPDATE existentes da tabela anuncios
--          (previne duplicatas e garante idempotência total)
-- -----------------------------------------------------------------------------

-- Nomes históricos conhecidos que podem existir no banco:
DROP POLICY IF EXISTS "Users can update own ads"             ON public.anuncios;
DROP POLICY IF EXISTS "Users can update their own ads"       ON public.anuncios;
DROP POLICY IF EXISTS "Allow users to update their own ads"  ON public.anuncios;
DROP POLICY IF EXISTS "Owner can update ad"                  ON public.anuncios;
DROP POLICY IF EXISTS "Admins can update any ad"             ON public.anuncios;
DROP POLICY IF EXISTS "Admins can update all ads"            ON public.anuncios;
DROP POLICY IF EXISTS "Admin update ads"                     ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_update_owner"                ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_update_admin"                ON public.anuncios;

-- -----------------------------------------------------------------------------
-- PASSO 2: CAMADA 1 — Policy UPDATE para o dono do anúncio
-- -----------------------------------------------------------------------------
-- USING:      Garante que só pode iniciar UPDATE em anúncio que lhe pertence.
-- WITH CHECK: Garante que o resultado do UPDATE ainda pertence ao mesmo user.
--             → Bloqueia tentativa de trocar user_id (Mass Assignment).
-- -----------------------------------------------------------------------------
CREATE POLICY "anuncios_update_owner"
ON public.anuncios
FOR UPDATE
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- -----------------------------------------------------------------------------
-- PASSO 3: CAMADA 2 — Policy UPDATE para admins
-- -----------------------------------------------------------------------------
-- USING:      Admin pode ver e iniciar UPDATE em qualquer anúncio.
-- WITH CHECK: Admin pode definir qualquer estado final (aprovação, rejeição).
-- DEPENDE:    public.is_admin() — SECURITY DEFINER, sem risco de recursão RLS.
-- -----------------------------------------------------------------------------
CREATE POLICY "anuncios_update_admin"
ON public.anuncios
FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    true
);

-- =============================================================================
-- FIM DO SCRIPT PRINCIPAL
-- =============================================================================


-- =============================================================================
-- ROLLBACK — Execute APENAS em caso de problema
-- =============================================================================
/*
-- Para reverter completamente a ETAPA 3, execute o bloco abaixo:

DROP POLICY IF EXISTS "anuncios_update_owner" ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_update_admin"  ON public.anuncios;

-- ATENÇÃO: Após o rollback, updates de usuários ficam BLOQUEADOS por padrão
-- (RLS habilitado sem policy permissiva = deny all).
-- Recrie uma policy permissiva temporária se necessário:
--
-- CREATE POLICY "temp_allow_own_updates"
-- ON public.anuncios FOR UPDATE
-- USING (auth.uid() = user_id);
*/


-- =============================================================================
-- AUDITORIA — Execute após o script principal para verificar as policies
-- =============================================================================
/*
-- Query de auditoria das policies ativas na tabela anuncios:

SELECT
    policyname,
    cmd,
    qual        AS using_clause,
    with_check  AS with_check_clause,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'anuncios'
ORDER BY cmd, policyname;

-- Resultado esperado para UPDATE:
-- policyname              | cmd    | using_clause              | with_check_clause
-- anuncios_update_owner   | UPDATE | (uid() = user_id)         | (uid() = user_id)
-- anuncios_update_admin   | UPDATE | public.is_admin()         | true
*/


-- =============================================================================
-- QUERIES DE TESTE MANUAL — Execute no SQL Editor do Supabase
-- =============================================================================
/*
-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  IMPORTANTE: substitua <SEU_ANUNCIO_ID> e <OUTRO_USER_ID> por UUIDs    ║
-- ║  reais do seu banco antes de executar.                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- TESTE 1 — UPDATE legítimo pelo dono → deve PASSAR (1 row affected)
--   (Execute logado como usuário comum via anon key)
UPDATE public.anuncios
SET titulo = 'Título Atualizado Legitimamente'
WHERE id = '<SEU_ANUNCIO_ID>'
  AND user_id = auth.uid();
-- Esperado: UPDATE 1

-- TESTE 2 — Tentar trocar user_id → deve FALHAR (0 rows affected, sem erro)
--   (RLS bloqueia no WITH CHECK antes do trigger)
UPDATE public.anuncios
SET user_id = '<OUTRO_USER_ID>'
WHERE id = '<SEU_ANUNCIO_ID>';
-- Esperado: UPDATE 0

-- TESTE 3 — UPDATE em anúncio de outro usuário → deve FALHAR (0 rows affected)
UPDATE public.anuncios
SET titulo = 'Hack'
WHERE id = '<ANUNCIO_DE_OUTRO_USUARIO>';
-- Esperado: UPDATE 0

-- TESTE 4 — Tentar setar USING(true) inexistente (apenas verificação de auditoria)
--   Garanta que nenhuma policy "USING (true)" existe na query abaixo:
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'anuncios'
  AND cmd = 'UPDATE'
  AND qual = 'true';
-- Esperado: 0 rows

-- TESTE 5 — Admin pode atualizar qualquer anúncio
--   (Execute com service_role key ou como usuário com is_admin = true)
UPDATE public.anuncios
SET status = 'ativo'
WHERE id = '<QUALQUER_ANUNCIO_ID>';
-- Esperado: UPDATE 1
*/
