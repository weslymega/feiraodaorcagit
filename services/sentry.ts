/**
 * ============================================================
 * SENTRY SERVICE — Feirão da Orca
 * ============================================================
 * Fail-safe wrapper para o SDK do Sentry.
 *
 * REGRAS CRÍTICAS:
 * 1. NUNCA usar `await` nas chamadas Sentry.
 * 2. Todo código Sentry envolto em try-catch.
 * 3. NUNCA bloquear fluxo principal (AdMob, JWT, Supabase).
 * 4. LGPD: Tokens, senhas, emails e telefones NUNCA saem do app.
 * ============================================================
 */

import * as Sentry from '@sentry/react';

// ─── CONSTANTES ─────────────────────────────────────────────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const IS_ENABLED = !!SENTRY_DSN;

/**
 * Detecta o ambiente automaticamente.
 * Usa VITE_APP_URL para distinguir local de produção.
 * Isso garante que erros de dev não poluam o dashboard de produção.
 */
const ENVIRONMENT = (() => {
  try {
    const appUrl = import.meta.env.VITE_APP_URL || '';
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) return 'development';
    if (appUrl.includes('vercel.app') || appUrl.includes('feiraodaorca')) return 'production';
    // Fallback: usar o host atual
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' ? 'development' : 'production';
    }
  } catch { /* FAIL-SAFE */ }
  return 'production';
})();

/** Campos PII que NUNCA devem ser enviados ao Sentry. */
const PII_KEYS = [
  'access_token', 'refresh_token', 'token', 'password', 'senha',
  'email', 'phone', 'telefone', 'cpf', 'authorization', 'bearer',
  'apikey', 'api_key', 'secret', 'private_key',
  // Campos adicionais auditados
  'name', 'username', 'user_name', 'display_name', 'full_name',
  'whatsapp', 'celular', 'contact',
];

// ─── SANITIZAÇÃO (LGPD) ─────────────────────────────────────

/**
 * Sanitiza recursivamente um objeto removendo campos PII.
 * Profundidade máxima: 5 níveis. Campos sensíveis → '[FILTERED]'.
 */
function sanitizeData(data: any, depth = 0): any {
  if (depth > 5 || data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // JWT detectado pela estrutura de 3 partes
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(data)) {
      return '[JWT_FILTERED]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (PII_KEYS.some(pii => lowerKey.includes(pii))) {
        clean[key] = '[FILTERED]';
      } else {
        clean[key] = sanitizeData(value, depth + 1);
      }
    }
    return clean;
  }

  return data;
}

// ─── INICIALIZAÇÃO ──────────────────────────────────────────

/**
 * Inicializa o Sentry de forma fail-safe.
 * Deve ser chamado UMA VEZ no index.tsx, ANTES do ReactDOM.createRoot.
 */
export function initSentry(): void {
  if (!IS_ENABLED) {
    console.info('[Sentry] DSN não configurado. Monitoramento desativado.');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: `feiraodaorca@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

      // Performance: amostragem baixa — sem latência perceptível
      // Em dev, captura 100% para facilitar debugging
      tracesSampleRate: ENVIRONMENT === 'development' ? 1.0 : 0.1,

      // Replay desativado em mobile (consumo de dados e privacidade LGPD)
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,

      // Ignora erros de extensões de browser / WebView chrome internals
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /capacitor:\/\//i,
      ],

      // Ignora erros triviais — usamos RegExp para matching robusto
      ignoreErrors: [
        /ResizeObserver loop/i,
        /Network request failed/i,
        /Load failed/i,
        /AbortError/i,
        /The user aborted/i,
        // Erros de JWT esperados (refresh silencioso em andamento) — NÃO são bugs
        /JWT_EXPIRED/i,
        /invalid_token/i,
      ],

      /**
       * beforeSend: Última linha de defesa — LGPD/CCPA.
       * Sanitiza TODO o payload antes de enviar ao servidor Sentry.
       * Retorna null para descartar o evento se sanitização falhar.
       */
      beforeSend(event) {
        try {
          // 1. Sanitiza campos extras
          if (event.extra) event.extra = sanitizeData(event.extra);

          // 2. Sanitiza breadcrumbs
          if (event.breadcrumbs?.values) {
            event.breadcrumbs.values = event.breadcrumbs.values.map(bc => ({
              ...bc,
              data: bc.data ? sanitizeData(bc.data) : bc.data,
              // Remove mensagens de breadcrumb que contenham tokens ou emails
              message: bc.message && /Bearer |eyJ/.test(bc.message)
                ? '[FILTERED_BREADCRUMB]'
                : bc.message,
            }));
          }

          // 3. Sanitiza headers e body do request
          if (event.request) {
            if (event.request.headers) event.request.headers = sanitizeData(event.request.headers);
            if (event.request.data) event.request.data = sanitizeData(event.request.data);
            // Remove query strings que possam conter tokens
            if (event.request.query_string) event.request.query_string = '[FILTERED]';
          }

          // 4. Remove PII do objeto user — apenas UUID interno do Supabase é permitido
          if (event.user) {
            const { id } = event.user as any;
            event.user = id ? { id } : undefined;
          }

          // 5. Fingerprinting de erros JWT — agrupa todos em um único issue
          const errMsg = event.exception?.values?.[0]?.value || '';
          if (/jwt|token|401|403/i.test(errMsg)) {
            event.fingerprint = ['auth-error', '{{ default }}'];
          }

          return event;
        } catch {
          // Se sanitização falhar, descarta para não vazar PII
          return null;
        }
      },
    });
  } catch (err) {
    // FAIL-SAFE: Inicialização do Sentry NUNCA quebra o boot do app
    console.warn('[Sentry] Falha na inicialização (ignorada):', err);
  }
}

// ─── HELPERS PÚBLICOS (FIRE AND FORGET — NUNCA AWAIT) ───────

/**
 * Associa o usuário logado ao contexto do Sentry.
 * Usa APENAS o UUID interno do Supabase — sem email, sem PII.
 */
export function setSentryUser(userId: string | null): void {
  if (!IS_ENABLED) return;
  try {
    userId ? Sentry.setUser({ id: userId }) : Sentry.setUser(null);
  } catch { /* FAIL-SAFE */ }
}

/**
 * Captura uma exceção crítica no Sentry.
 *
 * ⚠️ NUNCA chamar com `await`.
 * Uso: captureError(error, { tags: { endpoint: 'activate-turbo' } })
 */
export function captureError(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): void {
  if (!IS_ENABLED) return;
  try {
    Sentry.withScope(scope => {
      // Tags padrão para contexto de negócio
      scope.setTag('app', 'feiraodaorca');
      if (context?.tags) {
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      }
      if (context?.extra) {
        scope.setExtras(sanitizeData(context.extra));
      }
      if (context?.level) {
        scope.setLevel(context.level);
      }
      Sentry.captureException(error);
    });
  } catch { /* FAIL-SAFE */ }
}

/**
 * Adiciona um breadcrumb de evento de negócio crítico.
 *
 * ✅ Usar para: turbo_click, api_fail, upload_fail
 * ❌ NÃO usar para: navegação simples, sucesso de operações, eventos UI
 * ❌ NÃO chamar dentro do ciclo de vídeo AdMob
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
): void {
  if (!IS_ENABLED) return;
  try {
    Sentry.addBreadcrumb({
      category: 'business',
      message,
      data: data ? sanitizeData(data) : undefined,
      level,
      timestamp: Date.now() / 1000,
    });
  } catch { /* FAIL-SAFE */ }
}

/**
 * Define uma tag global de contexto.
 */
export function setSentryTag(key: string, value: string): void {
  if (!IS_ENABLED) return;
  try {
    Sentry.setTag(key, value);
  } catch { /* FAIL-SAFE */ }
}

/**
 * Envia uma mensagem manual ao Sentry (usado em smoke tests de produção).
 *
 * ✅ Uso correto:
 *   captureMessage('SMOKE_TEST: Deploy OK')
 *
 * ❌ NÃO usar para:
 *   - fluxos normais de negócio
 *   - dentro do ciclo AdMob
 *   - loops ou eventos frequentes
 *
 * ⚠️ NUNCA chamar com `await`.
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): void {
  if (!IS_ENABLED) return;
  try {
    Sentry.captureMessage(message, level);
  } catch { /* FAIL-SAFE */ }
}
