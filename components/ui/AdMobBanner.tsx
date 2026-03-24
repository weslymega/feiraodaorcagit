import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BannerAdPosition } from '@capacitor-community/admob';
import AdManager from '../../services/AdManager';
import { Screen, User } from '../../types';

interface AdMobBannerProps {
  currentScreen?: Screen;
  user?: User | null;
  position?: BannerAdPosition;
  className?: string;
}

// 🚩 FLAG GLOBAL DE SEGURANÇA (Set to false for testing)
const ENABLE_ADS = false;

// 🛡️ TELAS PERMITIDAS
const ALLOWED_SCREENS: Screen[] = [
  Screen.VEHICLES_LIST,
  Screen.REAL_ESTATE_LIST,
  Screen.PARTS_SERVICES_LIST
];

/**
 * AdMob Adaptive Banner Component - Guarded Mode
 */
export const AdMobBanner: React.FC<AdMobBannerProps> = ({ 
  currentScreen,
  user,
  position = BannerAdPosition.BOTTOM_CENTER,
  className = "" 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const isNative = Capacitor.isNativePlatform();
  const isMounted = React.useRef(true);
  const timeoutRef = React.useRef<any>(null);

  // --- GUARDS DE SEGURANÇA (BLOQUEIO TOTAL) ---
  
  // 1. Flag Global
  if (!ENABLE_ADS) return null;

  // 2. Ambiente Nativo
  if (!isNative || !document || !window) return null;

  // 3. Usuário Logado (Impedir crash no Login/Register)
  if (!user) {
    console.warn("[AdMob] Bloqueio: Usuário não logado");
    return null;
  }

  // 4. Tela Permitida
  if (currentScreen && !ALLOWED_SCREENS.includes(currentScreen)) {
    console.warn(`[AdMob] Bloqueio: Tela '${currentScreen}' não autorizada`);
    return null;
  }

  useEffect(() => {
    isMounted.current = true;
    
    console.log("[AdMob] Iniciando processo de exibição protegida...");

    // Delay de segurança para garantir Activity estável
    timeoutRef.current = setTimeout(async () => {
      if (!isMounted.current) return;

      try {
        console.log("[AdMob] Invocando showBanner (try-catch)...");
        await AdManager.showBanner(position);
        
        if (isMounted.current) {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("[AdMob] Erro capturado ao exibir banner:", e);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }, 1200);

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Remove banner ao sair da tela para evitar race conditions
      AdManager.removeBanner().catch(err => 
        console.warn("[AdMob] Erro ao remover banner no unmount:", err)
      );
    };
  }, [position, currentScreen]);

  return (
    <div 
      className={`w-full flex flex-col items-center justify-center my-4 ${className}`}
      style={{ minHeight: '60px' }}
    >
      {isLoading && (
        <div className="w-full h-[60px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Publicidade</span>
        </div>
      )}
      <div id="admob-banner-placeholder" />
    </div>
  );
};
