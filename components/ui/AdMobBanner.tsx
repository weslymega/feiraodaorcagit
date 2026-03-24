
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

  const isMounted = React.useRef(true);
  const timeoutRef = React.useRef<any>(null);

  useEffect(() => {
    isMounted.current = true;
    if (!isNative) return;

    // Small delay to ensure view is ready (Rule #2)
    timeoutRef.current = setTimeout(async () => {
      if (!isMounted.current) return;

      try {
        await AdManager.showBanner(position);
        if (isMounted.current) {
          setIsLoading(false);
        }
      } catch (e) {
        console.warn("[AdMob] Banner failed to load:", e);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }, 300);

    // Clean up on unmount
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (isNative) {
        // Essential: Remove from native view on unmount (Rule #3)
        AdManager.removeBanner().catch(err => 
          console.warn("[AdMob] Cleanup removeBanner failed:", err)
        );
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
