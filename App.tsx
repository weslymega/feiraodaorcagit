import React, { useEffect, useState } from 'react';
import { AppRouter } from './components/AppRouter';
import { useAppState } from './hooks/useAppState';
import { useAppActions } from './hooks/useAppActions';
import { AppLoadingOverlay } from './components/AppLoadingOverlay';
import { PublicRouteHandler } from './components/router/PublicRouteHandler';
import { Toast } from './components/Shared';

import { App as CapApp } from '@capacitor/app';
import { api } from './services/api';

const App: React.FC = () => {
  const state = useAppState();
  const actions = useAppActions(state);

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
          state.setToast({ message: "Erro ao abrir o anúncio via QR Code.", type: 'error' });
        }
      }
    };

    // 1. Escuta eventos com o app já em execução (Background -> Foreground)
    const appUrlListener = CapApp.addListener('appUrlOpen', (event) => {
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
      <div id="app-main-container" className="bg-gray-50 h-screen text-slate-800 font-sans max-w-md mx-auto shadow-2xl relative border-x border-gray-100 flex items-center justify-center">
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
