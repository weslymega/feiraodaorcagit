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
const ENABLE_ADS = true;

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
}) => {
  const isNative = Capacitor.isNativePlatform();
  const isMounted = React.useRef(true);
  const timeoutRef = React.useRef<any>(null);

  // --- GUARDS DE SEGURANÇA ---
  if (!ENABLE_ADS || !isNative || !user) return null;

  const ALLOWED = currentScreen && ALLOWED_SCREENS.includes(currentScreen);
  if (!ALLOWED) return null;

  useEffect(() => {
    isMounted.current = true;
    
    console.log("[AdMob] 🔍 Iniciando banner nativo (Side Effect)...");

    timeoutRef.current = setTimeout(async () => {
      if (!isMounted.current) return;

      try {
        console.log("[AdMob] ⚡ showBanner...");
        await AdManager.showBanner(position);
      } catch (e) {
        console.error("[AdMob] ❌ Erro ao exibir banner:", e);
      }
    }, 1200);

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      console.log("[AdMob] ⏹️ Removendo banner no unmount");
      AdManager.removeBanner().catch(() => {});
    };
  }, [position, currentScreen]);

  // Retorna um marcador visual (invisível ao toque) com z-index definido
  return (
    <div 
      className="fixed bottom-0 left-0 w-full z-10 pointer-events-none h-[50px]" 
      aria-hidden="true"
    />
  );
};
