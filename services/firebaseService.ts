import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { FirebasePerformance } from '@capacitor-firebase/performance';
import { Capacitor } from '@capacitor/core';

/**
 * SERVIÇO DE OBSERVABILIDADE CRÍTICA - FEIRÃO DA ORCA
 * Padrão: Fire-and-forget (Não bloqueante)
 * Segurança: LGPD Compliant & Isolação de Thread
 */
export const FirebaseService = {
  /**
   * Inicializa o monitoramento.
   * Não deve ser awaited em fluxo de boot crítico.
   */
  async initialize() {
    if (Capacitor.getPlatform() === 'web') return;
    // Performance e Analytics inicializam via SDK Nativo
  },

  /**
   * Rastreia a visualização de uma tela.
   * SEM AWAIT: Dispara e esquece.
   */
  trackScreen(screenName: string) {
    if (Capacitor.getPlatform() === 'web' || !screenName) return;

    FirebaseAnalytics.setScreenName({
      screenName: screenName,
    }).catch(() => { /* Silent fail: Não interfere na UI */ });
  },

  /**
   * Registra um evento customizado.
   * LGPD Check: Sanitiza params para evitar PII.
   */
  logEvent(eventName: string, params: Record<string, any> = {}) {
    if (Capacitor.getPlatform() === 'web') return;

    // SANITIZAÇÃO LGPD: Remove campos sensíveis proibidos
    const { 
      email, phone, name, ad_title, title, description, 
      ...safeParams 
    } = params;

    FirebaseAnalytics.logEvent({
      name: eventName,
      params: safeParams,
    }).catch(() => { /* Fail-safe */ });
  },

  /**
   * Define o ID do usuário (UUID).
   * Nunca enviar email ou nome aqui.
   */
  setUserId(userId: string) {
    if (Capacitor.getPlatform() === 'web' || !userId) return;

    FirebaseAnalytics.setUserId({ userId }).catch(() => {});
    FirebaseCrashlytics.setUserId({ userId }).catch(() => {});
  },

  /**
   * Registra um erro no Crashlytics sem bloquear a thread.
   */
  logError(message: string, error: any) {
    if (Capacitor.getPlatform() === 'web') {
      console.error(message, error);
      return;
    }

    FirebaseCrashlytics.recordException({
      message: message,
      stacktrace: error?.stack || '',
    }).catch(() => {});
  },

  /**
   * Inicia um trace de performance manual.
   */
  startTrace(traceName: string) {
    if (Capacitor.getPlatform() === 'web') return null;
    
    // Performance traces são nativos e não bloqueiam UI
    return FirebasePerformance.startTrace({ traceName }).catch(() => null);
  }
};
