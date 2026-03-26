import React, { useEffect } from 'react';
import { AppRouter } from './components/AppRouter';
import { useAppState } from './hooks/useAppState';
import { useAppActions } from './hooks/useAppActions';
import { AppLoadingOverlay } from './components/AppLoadingOverlay';

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
      const adMatch = url.match(/\/ad\/([a-zA-Z0-9-._~]+)/);
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

  if (!state.sessionReady) {
    return <AppLoadingOverlay isActive message="Iniciando sessão..." />;
  }

  return <AppRouter state={state} actions={actions} />;
};

export default App;
