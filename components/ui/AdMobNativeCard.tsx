
import React from 'react';
import { Tag, Info } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface AdMobNativeCardProps {
  className?: string;
}

/**
 * AdMob Native Ad Card (Placeholder for Native Ads)
 * Follows Rule #1, #2, #7, #11:
 * - Anti-accidental click margins (16px) & padding (8px)
 * - Visual "Patrocinado" label
 * - Min-height 120px for CLS
 * - Premium design
 */
export const AdMobNativeCard: React.FC<AdMobNativeCardProps> = ({ className = "" }) => {
  const isNative = Capacitor.isNativePlatform();

  if (!isNative) return null;

  return (
    <div 
      className={`mx-4 my-4 p-4 rounded-3xl bg-white border border-blue-50 shadow-sm relative overflow-hidden transition-all hover:border-blue-200 group animate-in fade-in duration-500 ${className}`}
      style={{ 
        minHeight: '120px', // Rule #7
        marginTop: '16px',  // Rule #1
        marginBottom: '16px', // Rule #1
        paddingTop: '8px',   // Rule #1
        paddingBottom: '8px' // Rule #1
      }}
    >
      {/* Rule #2: Visual Identification */}
      <div className="flex items-center gap-2 mb-3">
        <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md flex items-center gap-1.5">
          <Tag className="w-3 h-3" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Patrocinado</span>
        </div>
        <div className="p-1 bg-gray-50 rounded-full text-gray-300">
          <Info className="w-3 h-3" />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Ad Placeholder Visuals to prevent empty space feel */}
        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 bg-gray-100 rounded-full" />
        </div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-50 rounded-full w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
          <div className="h-3 bg-gray-50 rounded-full w-full animate-pulse" />
        </div>
      </div>

      {/* 
         In a real implementation, the Native Ad content from AdMob 
         would be mapped here. For now, this serves as the secure 
         container for Native Ad integration.
      */}
      <div className="absolute inset-0 z-10 pointer-events-none border-2 border-transparent group-hover:border-blue-100/50 rounded-3xl transition-colors" />
    </div>
  );
};
