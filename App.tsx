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

  // --- DEEP LINK HANDLER (SENIOR ARCHITECTURE) ---
  useEffect(() => {
    if (!state.sessionReady) return;

    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep Link Detector:', url);
      
      // Regex robusto para /ad/{id}
      const adMatch = url.match(/\/anuncio\/([a-zA-Z0-9-._~]+)/);
      const adId = adMatch ? adMatch[1] : null;

      if (adId) {
        try {
          // Busca dados do anúncio via API para garantir que o estado local não falhe
          // Isso funciona mesmo que o feed ainda esteja carregando
          const ad = await api.getAdById(adId);
          if (ad) {
            actions.handleAdClick(ad);
          } else {
            state.setToast({ message: "Anúncio indisponível ou removido.", type: 'error' });
          }
        } catch (error) {
          console.error("Deep Link Error:", error);
          captureError(error instanceof Error ? error : new Error(String(error)), { tags: { context: 'handleDeepLink' } });
          state.setToast({ message: "Erro ao abrir o anúncio via QR Code.", type: 'error' });
        }
      }
    };

    // 1. Escuta eventos com o app já em execução (Background -> Foreground)
    const appUrlListener = CapApp.addListener('appUrlOpen', async (event) => {
      console.log('[AUTH DEBUG] URL recebida:', event.url);
      
      if (
        event.url.includes('auth/callback') || 
        event.url.includes('access_token') || 
        event.url.includes('code') || 
        event.url.includes('refresh_token') ||
        event.url.includes('/auth')
      ) {
        try {
          const urlObj = new URL(event.url);
          const code = urlObj.searchParams.get('code');
          
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            console.log('[AUTH DEBUG] Sessão criada');
          } else if (urlObj.hash && urlObj.hash.includes('access_token')) {
            const params = new URLSearchParams(urlObj.hash.substring(1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
              console.log('[AUTH DEBUG] Sessão criada');
            }
          }

          console.log('[AUTH] Processando OAuth callback');
          const { data } = await supabase.auth.getSession();
          
          // 🔴 LIBERA A UI
          if (typeof actions.setAuthLoading === 'function') {
            actions.setAuthLoading(false);
          } else {
            state.setAuthLoading(false);
          }

          if (data?.session?.user != null) {
            console.log('[AUTH DEBUG] Usuário autenticado');
            window.location.href = '/';
            return;
          }
        } catch (error) {
          console.error('[AUTH DEBUG] Erro ao recuperar sessão:', error);
          captureError(error instanceof Error ? error : new Error(String(error)), { tags: { context: 'authCallback' } });
          if (typeof actions.setAuthLoading === 'function') {
            actions.setAuthLoading(false);
          } else {
            state.setAuthLoading(false);
          }
        }
      }
      handleDeepLink(event.url);
    });

    // 2. Trata Cold Start (App fechado sendo aberto pelo link)
    CapApp.getLaunchUrl().then((launchUrl) => {
      if (launchUrl?.url) {
        handleDeepLink(launchUrl.url);
      }
    });

    return () => {
      appUrlListener.then(l => l.remove());
    };
  }, [state.isAppReady, state.sessionReady, actions]);

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

  // --- PUSH NOTIFICATIONS INIT (FASE 3) ---
  useEffect(() => {
    PushService.init();
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
            actions.handleAdClick(ad);
          }
        } else if (type === 'admin') {
          state.setCurrentScreen(Screen.NOTIFICATIONS);
        }
      } catch (e) {
        console.error('Error in Push Navigation:', e);
      }
    });
  }, [state.sessionReady, actions]);

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
          actions.refetchAd(adId);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [state.sessionReady, actions]);

  // --- CONTROLE DE LOADING GLOBAL EXPLÍCITO (FULLSCREEN & EXCLUSIVO) ---
  // Racional: Não bloqueamos rotas híbridas (Termos/Privacidade) se já tivermos sessão básica,
  // mesmo que o perfil completo ainda esteja sincronizando.
  const isLegalRoute = state.currentScreen === 'terms_of_use' || state.currentScreen === 'privacy_policy';
  
  const isAppLoading = (!state.sessionReady && !isLegalRoute) || 
                       (!!state.user && !state.profileLoaded && !isLegalRoute) || 
                       state.authLoading;

  const [showExclusiveLoading, setShowExclusiveLoading] = useState(isAppLoading);

  useEffect(() => {
    if (isAppLoading) {
      setShowExclusiveLoading(true);
    } else {
      // Debounce de 300ms para evitar flicker
      const timer = setTimeout(() => setShowExclusiveLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAppLoading]);

  // Se estiver em loading, NADA da árvore principal (AppRouter, BottomNav) é construído.
  if (showExclusiveLoading) {
    const loadingMsg = state.authLoading 
      ? "Finalizando sessão..." 
      : (!state.profileLoaded && state.user 
          ? "Sincronizando perfil..." 
          : "Iniciando sessão...");

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

      {(!state.sessionReady || state.authLoading) ? (
        <div id="app-main-container" className="bg-gray-50 h-[calc(100dvh-var(--sat)-var(--sab))] text-slate-800 font-sans max-w-md mx-auto shadow-2xl relative border-x border-gray-100 flex items-center justify-center">
          <AppLoadingOverlay isActive={true} message="Finalizando sessão..." />
        </div>
      ) : (
        <AppRouter state={state} actions={actions} />
      )}
    </>
  );
};

export default App;
