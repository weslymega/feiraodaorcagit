import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { supabase } from './api';

type PushNavigationHandler = (data: any) => void;
let navigationHandler: PushNavigationHandler | null = null;

/**
 * SERVIÇO DE PUSH NOTIFICATIONS - FEIRÃO DA ORCA
 * FASE 3: Gerenciamento de Tokens
 */
export const PushService = {
  /**
   * Define o handler para navegação disparada por push
   */
  setNavigationHandler(handler: PushNavigationHandler) {
    navigationHandler = handler;
  },

  /**
   * Inicializa listeners globais
   */
  async init() {
    if (Capacitor.getPlatform() === 'web') return;

    // Listener para quando o token é atualizado pelo Firebase
    FirebaseMessaging.addListener('tokenReceived', async (event) => {
      console.log('Push token received/rotated:', event.token);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.saveTokenToDb(user.id, event.token);
      }
    });

    // Listener para erros do plugin
    FirebaseMessaging.addListener('error', (error) => {
      console.error('Push Messaging Error:', error);
    });

    // Listener para recebimento em foreground (Fase 4)
    FirebaseMessaging.addListener('notificationReceived', (event) => {
      console.log('Push notification received (foreground):', event.notification);
    });

    // Listener para clique na notificação (Fase 4/5)
    FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      console.log('Push notification action clicked:', event.notification);
      if (navigationHandler && event.notification.data) {
        navigationHandler(event.notification.data);
      }
    });
  },

  /**
   * Solicita permissão ao usuário (Android 13+)
   */
  async requestPermissions() {
    if (Capacitor.getPlatform() === 'web') return false;
    
    try {
      const { receive } = await FirebaseMessaging.requestPermissions();
      return receive === 'granted';
    } catch (e) {
      console.error('Error requesting push permissions:', e);
      return false;
    }
  },

  /**
   * Obtém o token FCM atual
   */
  async getToken() {
    if (Capacitor.getPlatform() === 'web') return null;
    
    try {
      const { token } = await FirebaseMessaging.getToken();
      return token;
    } catch (e) {
      console.error('Error getting push token:', e);
      return null;
    }
  },

  /**
   * Fluxo completo de registro do usuário logado
   */
  async registerUser(userId: string, setToast?: (toast: any) => void) {
    if (Capacitor.getPlatform() === 'web' || !userId) return;

    try {
      console.log('[PushService] Iniciando fluxo de registro para:', userId);
      
      const isGranted = await this.requestPermissions();
      console.log('[PushService] Permissão concedida:', isGranted);
      
      if (!isGranted) {
        console.warn('[PushService] Permissão negada pelo usuário ou sistema');
        return;
      }

      console.log('[PushService] Solicitando token ao Firebase...');
      const token = await this.getToken();
      
      if (token) {
        console.log('[PushService] Token obtido:', token.substring(0, 10) + '...');
        const success = await this.saveTokenToDb(userId, token);
        if (!success && setToast) {
          setToast({ message: "Erro ao sincronizar notificações.", type: 'error' });
        }
      } else {
        console.error('[PushService] Falha ao obter token do Firebase');
        if (setToast) {
          setToast({ message: "Não foi possível ativar notificações (Erro FCM).", type: 'error' });
        }
      }
    } catch (err) {
      console.error('[PushService] Falha crítica no registro:', err);
    }
  },

  /**
   * Persiste o token no Supabase com lógica de UPSERT
   */
  async saveTokenToDb(userId: string, token: string) {
    try {
      console.log(`[PushService] Salvando token no DB para user ${userId}...`);
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          { 
            user_id: userId, 
            token: token,
            platform: Capacitor.getPlatform(),
            last_seen_at: new Date().toISOString()
          },
          { onConflict: 'user_id, token' }
        );

      if (error) {
        console.error('[PushService] Erro ao salvar token no Supabase:', error);
        return false;
      } else {
        console.log('[PushService] Token sincronizado com sucesso!');
        return true;
      }
    } catch (e) {
      console.error('[PushService] Erro crítico em saveTokenToDb:', e);
      return false;
    }
  },

  /**
   * Remove o token (ex: no logout)
   */
  async removeToken(token: string) {
    if (Capacitor.getPlatform() === 'web' || !token) return;
    
    try {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('token', token);
      console.log('Push token removed from Supabase');
    } catch (e) {
      console.error('Error removing push token:', e);
    }
  }
};
