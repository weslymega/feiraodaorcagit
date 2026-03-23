
import React from 'react';
import { MapPin } from 'lucide-react';
import { AdItem } from '../types';
import { LOCATION_LABEL } from '../constants';

interface LocationSectionProps {
  ad: AdItem;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ ad }) => {
  return (
    <div className="mb-8 animate-in fade-in duration-500">
      <h3 className="font-bold text-gray-900 mb-4 text-lg leading-tight">
        {LOCATION_LABEL}
      </h3>
      
      <div className="bg-gray-100 rounded-2xl overflow-hidden h-44 relative flex items-center justify-center mb-2 border border-gray-200 shadow-inner group">
        {/* Background Decorative Icon */}
        <MapPin className="text-primary/20 w-16 h-16 mb-4 transition-transform group-hover:scale-110 duration-500" />
        
        {/* Overlay Badge with Location Name */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl text-sm font-bold shadow-xl text-gray-800 border border-white/50 flex items-center gap-2 transition-all group-hover:translate-y-[-4px]">
          <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="truncate flex-1">
            {ad.location || "Localização não informada"}
          </span>
        </div>
      </div>

      {!ad.location && (
        <p className="text-[10px] text-gray-400 text-center font-medium uppercase tracking-wider mt-2">
          Localização não disponível para este anúncio
        </p>
      )}
    </div>
  );
};
