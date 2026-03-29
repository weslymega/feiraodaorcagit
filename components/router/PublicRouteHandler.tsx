import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Screen, AdItem } from '../../types';
import { Loader2, AlertCircle, Home } from 'lucide-react';

interface PublicRouteHandlerProps {
  onAdFound: (ad: AdItem) => void;
  onNavigate: (screen: Screen) => void;
  currentScreen?: Screen; // New prop for URL Sync
}

/**
 * PublicRouteHandler (v3)
 * Decoupled logic for handling direct URLs like /anuncio/:id
 */
export const PublicRouteHandler: React.FC<PublicRouteHandlerProps> = ({ onAdFound, onNavigate, currentScreen }) => {
  const [error, setError] = useState<string | null>(null);
  const [loadingAd, setLoadingAd] = useState<boolean>(false);

  useEffect(() => {
    const path = window.location.pathname;

    // Detect immediate path for legal routes (OAuth Compliance)
    if (path === "/privacidade") {
      onNavigate(Screen.PRIVACY_POLICY);
      return;
    }
    if (path === "/termos") {
      onNavigate(Screen.TERMS_OF_USE);
      return;
    }

    const handleUrl = async () => {
      // Suppport legacy /ad/ and new /anuncio/
      const match = path.match(/\/(anuncio|ad)\/([a-zA-Z0-9-._~]+)/);
      if (!match) return;

      const adId = match[2];
      if (adId === 'view') return; // Ignore create ad preview

      console.log(`🔍 [PublicRoute] Ad URL Detected: ${adId}`);
      setLoadingAd(true);
      setError(null);

      try {
        // Analytics: Track QR/Direct Access
        console.log("📈 [Analytics] Guest Access via Direct URL:", adId);
        
        const ad = await api.getAdById(adId, 10000); // 10s timeout
        
        if (ad) {
          onAdFound(ad);
          
          // Route based on category
          if (ad.category === 'veiculos') onNavigate(Screen.VEHICLE_DETAILS);
          else if (ad.category === 'imoveis') onNavigate(Screen.REAL_ESTATE_DETAILS);
          else onNavigate(Screen.PART_SERVICE_DETAILS);
          
          // Clean URL for a better SPA experience (optional, but requested implicitly by "standardization")
          if (path.startsWith('/ad/')) {
            window.history.replaceState({}, '', `/anuncio/${adId}`);
          }
        }
      } catch (err: any) {
        console.error("❌ [PublicRoute] Error loading ad:", err.message);
        if (err.message === 'AD_NOT_FOUND' || err.message === 'AD_INACTIVE') {
          setError("Este anúncio não está mais disponível ou não foi encontrado.");
        } else if (err.message === 'TIMEOUT_ERROR') {
          setError("O servidor demorou muito para responder. Verifique sua conexão.");
        } else {
          setError("Ocorreu um erro ao carregar o anúncio. Tente novamente mais tarde.");
        }
      } finally {
        setLoadingAd(false);
      }
    };

    handleUrl();
  }, []);

  // --- URL SYNCHRONIZER (OAuth Compliance) ---
  useEffect(() => {
    if (!currentScreen) return;

    if (currentScreen === Screen.PRIVACY_POLICY && window.location.pathname !== '/privacidade') {
      console.log("🔗 [URL Sync] Updating URL to /privacidade");
      window.history.pushState({}, '', '/privacidade');
    } 
    else if (currentScreen === Screen.TERMS_OF_USE && window.location.pathname !== '/termos') {
      console.log("🔗 [URL Sync] Updating URL to /termos");
      window.history.pushState({}, '', '/termos');
    }
  }, [currentScreen]);

  if (loadingAd) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Carregando anúncio...</h2>
        <p className="text-gray-500">Buscando os melhores detalhes para você.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Ops! Problema no Anúncio</h2>
        <p className="text-gray-600 mb-8 max-w-xs mx-auto leading-relaxed">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            window.history.replaceState({}, '', '/');
            window.location.reload();
          }}
          className="bg-primary text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Voltar para o Início
        </button>
      </div>
    );
  }

  return null;
};
