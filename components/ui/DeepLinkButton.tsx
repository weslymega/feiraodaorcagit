import React from 'react';
import { Smartphone, ExternalLink } from 'lucide-react';

interface DeepLinkButtonProps {
  adId: string;
  className?: string;
}

/**
 * DeepLinkButton (v3)
 * Smart button to open the app or redirect to store/download
 */
export const DeepLinkButton: React.FC<DeepLinkButtonProps> = ({ adId, className = "" }) => {
  
  const handleOpenApp = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

    // Analytics: Track App Open attempt
    console.log("📈 [Analytics] App Open attempt triggered for Ad:", adId);

    const appUrl = `feiraodaorca://anuncio/${adId}`;
    const storeUrl = isAndroid 
      ? "https://play.google.com/store/apps/details?id=com.feiraodaorca.app" 
      : (isIOS ? "https://apps.apple.com/app/id-feiraodaorca" : "https://feiraodaorca.com/download");

    const startTime = Date.now();
    
    // Attempt to open the app
    window.location.href = appUrl;

    // Fallback logic: If after 2.5 seconds the page is still visible, it means the app isn't installed
    setTimeout(() => {
        if (Date.now() - startTime < 3000) {
            if (window.confirm("Você não possui o app instalado. Deseja baixar agora para negociar com o vendedor?")) {
                console.log("📈 [Analytics] Redirecting to Store/Download");
                window.location.href = storeUrl;
            }
        }
    }, 2500);
  };

  return (
    <button
      onClick={handleOpenApp}
      className={`flex items-center justify-center gap-2 font-black transition-all active:scale-[0.97] ${className}`}
    >
      <Smartphone className="w-5 h-5" />
      <span>Abrir no App</span>
      <ExternalLink className="w-4 h-4 opacity-50" />
    </button>
  );
};
