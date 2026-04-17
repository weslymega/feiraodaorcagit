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

/** Campos PII que NUNCA devem ser enviados ao Sentry. */
const PII_KEYS = [
  'access_token', 'refresh_token', 'token', 'password', 'senha',
  'email', 'phone', 'telefone', 'cpf', 'authorization', 'bearer',
  'apikey', 'api_key', 'secret', 'private_key'
];

// ─── SANITIZAÇÃO (LGPD) ─────────────────────────────────────

/**
 * Sanitiza recursivamente um objeto removendo campos PII.
 * Substitui o valor por '[FILTERED]'.
 */
function sanitizeData(data: any, depth = 0): any {
  if (depth > 5 || data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Se a string parece um JWT (3 partes separadas por ponto), filtra.
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
      environment: 'production',
      release: `feiraodaorca@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

      // Performance: amostragem baixa para não adicionar latência
      tracesSampleRate: 0.1,

      // Replay desativado em mobile (consumo de dados)
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,

      // Não capturar erros de extensões de browser ou scripts externos
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
      ],

      /**
       * beforeSend: Última linha de defesa para LGPD.
       * Sanitiza TODOS os dados antes de sair do dispositivo.
       * Retorna null para descartar o evento completamente se necessário.
       */
      beforeSend(event) {
        try {
          // Sanitiza o contexto extra
          if (event.extra) {
            event.extra = sanitizeData(event.extra);
          }
          // Sanitiza os breadcrumbs
          if (event.breadcrumbs?.values) {
            event.breadcrumbs.values = event.breadcrumbs.values.map(bc => ({
              ...bc,
              data: bc.data ? sanitizeData(bc.data) : bc.data,
            }));
          }
          // Sanitiza o contexto do request (headers, body)
          if (event.request) {
            if (event.request.headers) {
              event.request.headers = sanitizeData(event.request.headers);
            }
            if (event.request.data) {
              event.request.data = sanitizeData(event.request.data);
            }
          }
          // Remove user.email e user.ip_address para conformidade LGPD
          if (event.user) {
            delete (event.user as any).email;
            delete (event.user as any).ip_address;
            delete (event.user as any).username;
          }
          return event;
        } catch {
          // Se sanitização falhar, descarta o evento para não vazar PII
          return null;
        }
      },
    });
  } catch (err) {
    // FAIL-SAFE: Sentry nunca deve quebrar o boot do app
    console.warn('[Sentry] Falha na inicialização (ignorada):', err);
  }
}

// ─── HELPERS PÚBLICOS (FAIL-SAFE) ───────────────────────────

/**
 * Associa o usuário logado ao contexto do Sentry.
 * Usa APENAS o UUID interno — sem email, sem PII.
 */
export function setSentryUser(userId: string | null): void {
  if (!IS_ENABLED) return;
  try {
    if (userId) {
      Sentry.setUser({ id: userId });
    } else {
      Sentry.setUser(null);
    }
  } catch { /* FAIL-SAFE */ }
}

/**
 * Captura uma exceção no Sentry.
 * NUNCA usar await nesta função.
 * Adiciona tags padrão de contexto de negócio.
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
 * Adiciona um breadcrumb de evento de negócio.
 * NUNCA usar para logs de sucesso ou navegação simples.
 * NUNCA usar dentro do ciclo de vídeo do AdMob.
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
 * Define uma tag global de contexto no Sentry.
 */
export function setSentryTag(key: string, value: string): void {
  if (!IS_ENABLED) return;
  try {
    Sentry.setTag(key, value);
  } catch { /* FAIL-SAFE */ }
}
