
import { supabase } from './api';

/**
 * AUTH SERVICE SINGLETON
 * Centraliza o gerenciamento de sessão e listeners do Supabase.
 * Evita duplicação de eventos e loops de autenticação.
 */

export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'INITIAL_SESSION' | 'PASSWORD_RECOVERY';

type AuthCallback = (event: AuthEvent, session: any) => void;

class AuthService {
  private static instance: AuthService;
  private initialized = false;
  private callbacks: Set<AuthCallback> = new Set();
  private currentSession: any = null;
  private subscription: any = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Inicializa o listener global apenas UMA vez no ciclo de vida da aplicação.
   */
  public initialize() {
    try {
      if (this.initialized) return;
      this.initialized = true;

      console.log('🔐 [AuthService] Iniciando listener global...');
      
      // Captura a sessão inicial
      this.checkInitialSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        this.currentSession = session;
        this.notifySubscribers(event as AuthEvent, session);
      });

      this.subscription = subscription;
      console.log('✅ [AuthService] Listener registrado com sucesso.');
    } catch (error) {
      console.error('❌ [AuthService] Falha crítica na inicialização:', error);
    }
  }

  private async checkInitialSession() {
    const { data: { session } } = await supabase.auth.getSession();
    this.currentSession = session;
    this.notifySubscribers('INITIAL_SESSION', session);
  }

  /**
   * Permite que hooks do React se inscrevam para receber atualizações de auth.
   */
  public subscribe(callback: AuthCallback) {
    this.callbacks.add(callback);
    
    // Sempre envia o estado atual imediatamente para o novo inscrito (mesmo que seja null)
    callback('INITIAL_SESSION', this.currentSession);

    // Retorna a função de unsubscribe
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifySubscribers(event: AuthEvent, session: any) {
    this.callbacks.forEach(cb => {
      try {
        cb(event, session);
      } catch (e) {
        console.error('Error in Auth callback:', e);
      }
    });
  }

  public getSession() {
    return this.currentSession;
  }

  public async signOut() {
    await supabase.auth.signOut();
    this.currentSession = null;
  }
}

export const authService = AuthService.getInstance();
