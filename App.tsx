import React, { useEffect, useState } from 'react';
import { AppRouter } from './components/AppRouter';
import { useAppState } from './hooks/useAppState';
import { useAppActions } from './hooks/useAppActions';
import { AppLoadingOverlay } from './components/AppLoadingOverlay';
import { PublicRouteHandler } from './components/router/PublicRouteHandler';
import { Toast } from './components/Shared';

import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { api, supabase } from './services/api';
import { FirebaseService } from './services/firebaseService';
import { PushService } from './services/pushService';
import { captureError } from './services/sentry';

const App: React.FC = () => {
  const state = useAppState();
  const actions = useAppActions(state);

  // --- CONFIGURAÇÃO DE STATUS BAR (FASE 1 SEGURA) ---
  useEffect(() => {
    const initStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setStyle({ style: Style.Dark });
          console.log('✅ StatusBar configurado com sucesso');
        } catch (error) {
          console.error('❌ Erro ao configurar StatusBar:', error);
          captureError(error instanceof Error ? error : new Error(String(error)), { tags: { context: 'initStatusBar' } });
        }
      }
    };
    initStatusBar();
  }, []);
  // --- STABLE HANDLERS REFS ---
  // Racional: listeners globais devem ser registrados apenas UMA vez no mount.
  // Usamos refs para acessar o estado/ações mais recentes sem disparar re-runs dos efeitos.
  const actionsRef = React.useRef(actions);
  const stateRef = React.useRef(state);
  const hasProcessedLaunchUrl = React.useRef(false);

  useEffect(() => {
    actionsRef.current = actions;
    stateRef.current = state;
  }, [actions, state]);

  // --- DEEP LINK & AUTH HANDLER (SINGLETON MOUNT) ---
  useEffect(() => {
    const instanceId = Math.random().toString(36).substring(7);
    console.log(`🏗️ [APP MOUNT] Instância estável: ${instanceId}`);

    const handleDeepLink = async (url: string) => {
      console.log(`🔗 [DEEP LINK] [${instanceId}] Processando:`, url);
      const adMatch = url.match(/\/anuncio\/([a-zA-Z0-9-._~]+)/);
      const adId = adMatch ? adMatch[1] : null;

      if (adId) {
        try {
          const ad = await api.getAdById(adId);
          if (ad) {
            actionsRef.current.handleAdClick(ad);
          } else {
            stateRef.current.setToast({ message: "Anúncio indisponível.", type: 'error' });
          }
        } catch (error) {
          console.error("Deep Link Error:", error);
          captureError(error instanceof Error ? error : new Error(String(error)), { tags: { context: 'handleDeepLink' } });
        }
      }
    };

    const handleOAuthUrl = async (url: string) => {
      if (url.includes('auth/callback') || url.includes('access_token') || url.includes('code') || url.includes('/auth')) {
        console.log('✨ [STATUS] URL de Auth detectada');
        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          
          if (code) {
            console.log('🎫 [PROCESSO] Trocando código por sessão...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) console.error('❌ [ERRO TROCA]', error.message);
          } else if (urlObj.hash && urlObj.hash.includes('access_token')) {
            const params = new URLSearchParams(urlObj.hash.substring(1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
          return true;
        } catch (error) {
          console.error('❌ Error in OAuth handler:', error);
          stateRef.current.setAuthLoading(false);
        }
      }
      return false;
    };

    // 1. Escuta eventos em Runtime
    const appUrlListener = CapApp.addListener('appUrlOpen', async (event) => {
      if (Capacitor.isNativePlatform()) {
        const isAuth = await handleOAuthUrl(event.url);
        if (isAuth) return;
      }
      handleDeepLink(event.url);
    });

    // 2. Trata Cold Start (Apenas uma vez por mount)
    if (!hasProcessedLaunchUrl.current) {
      CapApp.getLaunchUrl().then(async (launchUrl) => {
        if (launchUrl?.url && !hasProcessedLaunchUrl.current) {
          hasProcessedLaunchUrl.current = true;
          if (Capacitor.isNativePlatform()) {
            const isAuth = await handleOAuthUrl(launchUrl.url);
            if (isAuth) return;
          }
          handleDeepLink(launchUrl.url);
        }
      });
    }

    return () => {
      console.log(`🔌 [APP UNMOUNT] Removendo listeners da instância: ${instanceId}`);
      appUrlListener.then(l => l.remove());
    };
  }, []); // DEPENDÊNCIA VAZIA: Roda apenas no mount real do App

  // --- FIREBASE MONITORING ---
  useEffect(() => {
    if (state.currentScreen) {
      FirebaseService.trackScreen(state.currentScreen);
    }
  }, [state.currentScreen]);

  useEffect(() => {
    if (state.user?.id) {
      FirebaseService.setUserId(state.user.id);
      // Registro de Push (Fase 3)
      PushService.registerUser(state.user.id, state.setToast);
    }
  }, [state.user?.id]);

  // --- URL CLEANER & SYNC (WEB ONLY) ---
  useEffect(() => {
    if (!Capacitor.isNativePlatform() && window.location.search.includes('code=')) {
      console.log('🧹 [Web] Limpando parâmetros de OAuth da URL...');
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // --- PUSH NOTIFICATIONS INIT (FASE 3/4) ---
  useEffect(() => {
    PushService.init((notification) => {
      // Exibir toast para notificações em foreground
      if (notification.title || notification.body) {
        state.setToast({
          message: `${notification.title ? notification.title + ': ' : ''}${notification.body || ''}`,
          type: 'info'
        });
      }
    });
  }, []);

  // --- PUSH NAVIGATION HANDLER (FASE 5) ---
  useEffect(() => {
    if (!state.sessionReady) return;

    PushService.setNavigationHandler(async (data) => {
      console.log('🚀 Push Navigation Triggered:', data);
      if (!data) return;

      const { type, adId, otherUserId, senderId, senderName, avatarUrl } = data;

      try {
        if (type === 'chat' && adId && (otherUserId || senderId)) {
          const targetUserId = otherUserId || senderId;
          const ad = await api.getAdById(adId);
          if (ad) {
            state.setSelectedAd(ad);
            state.setSelectedChat({
              id: `${adId}_${targetUserId}`,
              otherUserId: targetUserId,
              senderName: senderName || 'Usuário',
              avatarUrl: avatarUrl || '',
              adId: adId,
              adTitle: ad.title,
              lastMessage: '',
              time: 'Agora',
              unreadCount: 0
            });
            state.setCurrentScreen(Screen.CHAT_DETAIL);
          }
        } else if (type === 'ad' && adId) {
          const ad = await api.getAdById(adId);
          if (ad) {
            actionsRef.current.handleAdClick(ad);
          }
        } else if (type === 'admin') {
          state.setCurrentScreen(Screen.NOTIFICATIONS);
        }
      } catch (e) {
        console.error('Error in Push Navigation:', e);
      }
    });
  }, [state.sessionReady]); // Apenas re-registra se a sessão estabilizar

  // --- HARDENING: MONITOR DE SELF-HEALING (Sincronização de Anúncios) ---
  useEffect(() => {
    if (!state.sessionReady) return;

    const interval = setInterval(() => {
      const now = Date.now();
      state.activeLocksRef.current.forEach((lock, adId) => {
        // Se o lock persistir por mais de 10 segundos sem ACK do Realtime, algo falhou.
        // Forçamos um refetch para garantir consistência absoluta com o banco.
        if (now - lock.startTime > 10000) {
          console.warn(`[Self-Healing] Sincronização estagnada para ${adId}. Recuperando via Refetch...`);
          // Note: O lock é removido dentro do refetchAd após sucesso.
          actionsRef.current.refetchAd(adId);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [state.sessionReady]); // Estável após o boot

  // --- AUTH HYDRATION GATE (RENDER CONTROL) ---
  const isLegalRoute = state.currentScreen === 'terms_of_use' || state.currentScreen === 'privacy_policy';
  
  // Racional do Hydration Gate:
  // 1. initializing: Sempre loading (Supabase ainda não respondeu INITIAL_SESSION)
  // 2. resolved + user: Ainda loading (Aguardando fetchData e profileLoaded)
  // 3. resolved + !user: Pronto (Renderiza tela de LOGIN)
  // 4. ready: Pronto (Renderiza APP Principal)
  
  const isAppLoading = (state.authStatus === 'initializing' && !isLegalRoute) || 
                       (state.authStatus === 'resolved' && !!state.user && !isLegalRoute) || 
                       state.authLoading;

  const [showExclusiveLoading, setShowExclusiveLoading] = useState(true);

  useEffect(() => {
    if (isAppLoading) {
      setShowExclusiveLoading(true);
    } else {
      // Pequeno debounce apenas para evitar flicker em transições ultra-rápidas
      const timer = setTimeout(() => setShowExclusiveLoading(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isAppLoading]);

  // Se estiver em fase de hidratação, NADA da árvore principal é construído.
  if (showExclusiveLoading) {
    const loadingMsg = state.authStatus === 'initializing'
      ? "Iniciando sistema..."
      : (state.user ? "Sincronizando perfil..." : "Preparando acesso...");

    return (
      <div id="app-main-container" className="bg-gray-50 h-[calc(100dvh-var(--sat)-var(--sab))] text-slate-800 font-sans max-w-md mx-auto shadow-2xl relative border-x border-gray-100 flex items-center justify-center">
        <AppLoadingOverlay isActive={true} message={loadingMsg} />
      </div>
    );
  }

  return (
    <>
      {state.toast && (
        <Toast 
          message={state.toast.message} 
          type={state.toast.type} 
          onClose={() => state.setToast(null)} 
        />
      )}
      
      {state.sessionReady && (
        <PublicRouteHandler 
          onAdFound={actions.handleAdClick}
          onNavigate={state.setCurrentScreen}
          currentScreen={state.currentScreen}
        />
      )}

      <AppRouter state={state} actions={actions} />
    </>
  );
};

export default App;
