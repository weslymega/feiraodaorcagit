-- =============================================================================
-- FIX: INSERT RLS POLICY — tabela public.anuncios
-- =============================================================================
-- PROBLEMA: RLS está habilitado em public.anuncios mas NÃO existe nenhuma
--           policy de INSERT para usuários autenticados.
--           Resultado: 403 (new row violates row-level security policy) ao
--           tentar inserir via anon key (fallback do createAd).
--
-- CAUSA RAIZ: O script rls_hardening_anuncios.sql cobriu apenas UPDATE.
--             Os scripts anteriores nunca criaram uma INSERT policy em anuncios.
--
-- SOLUÇÃO: Criar policy de INSERT que:
--   1. Permite que usuários autenticados insiram seus próprios anúncios.
--   2. Garante (WITH CHECK) que o user_id inserido == auth.uid()
--      → Bloqueia Mass Assignment de user_id via INSERT.
-- =============================================================================

-- Idempotente: remove antes de recriar
DROP POLICY IF EXISTS "Users can insert own ads"   ON public.anuncios;
DROP POLICY IF EXISTS "Authenticated users can insert ads" ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_insert_owner"      ON public.anuncios;

-- Policy principal de INSERT
CREATE POLICY "anuncios_insert_owner"
ON public.anuncios
FOR INSERT
WITH CHECK (
    auth.uid() = user_id   -- Usuário só pode inserir anúncios com o seu próprio user_id
);

-- =============================================================================
-- AUDITORIA — Execute para confirmar que a policy foi criada
-- =============================================================================
/*
SELECT
    policyname,
    cmd,
    qual        AS using_clause,
    with_check  AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'anuncios'
ORDER BY cmd, policyname;

-- Resultado esperado: deve aparecer anuncios_insert_owner com cmd = INSERT
*/
