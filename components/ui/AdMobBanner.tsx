
import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BannerAdPosition } from '@capacitor-community/admob';
import AdManager from '../../services/AdManager';

interface AdMobBannerProps {
  position?: BannerAdPosition;
  className?: string;
}

/**
 * AdMob Adaptive Banner Component
 * Follows Rule #5, #6, #7, #9: 
 * - Adaptive layout
 * - Above footer
 * - Skeleton for CLS
 * - Web fallback (null)
 */
export const AdMobBanner: React.FC<AdMobBannerProps> = ({ 
  position = BannerAdPosition.BOTTOM_CENTER,
  className = "" 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const startBanner = async () => {
      try {
        await AdManager.showBanner(position);
        setIsLoading(false);
      } catch (e) {
        console.warn("[AdMob] Banner failed to load:", e);
        setIsLoading(false);
      }
    };

    startBanner();

    // Clean up on unmount
    return () => {
      if (isNative) {
        AdManager.hideBanner();
      }
    };
  }, [position, isNative]);

  if (!isNative) return null;

  return (
    <div 
      className={`w-full flex flex-col items-center justify-center my-4 ${className}`}
      style={{ minHeight: '60px' }} // Rule #7: CLS Protection
    >
      {isLoading && (
        <div className="w-full h-[60px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Publicidade</span>
        </div>
      )}
      {/* 
        Native AdMob banner is rendered over the webview by the plugin. 
        This div just holds the space in the React layout.
      */}
      <div id="admob-banner-placeholder" />
    </div>
  );
};
