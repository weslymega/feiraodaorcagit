import React from 'react';
import { ChevronLeft, Heart, Star, MapPin, Gauge, Calendar, Zap, Trophy } from 'lucide-react';
import { PriceTag } from '../components/Shared';
import { AdItem } from '../types';
import { getBoostRibbon, getBoostPriority } from '../utils/boostRibbon';

interface FeaturedVehiclesScreenProps {
  ads: AdItem[];
  onBack: () => void;
  onAdClick: (ad: AdItem) => void;
  favorites: AdItem[];
  onToggleFavorite: (ad: AdItem) => void;
}

export const FeaturedVehiclesScreen: React.FC<FeaturedVehiclesScreenProps> = ({
  ads,
  onBack,
  onAdClick,
  favorites,
  onToggleFavorite
}) => {

  const sortedAds = [...ads].sort((a, b) => {
    return getBoostPriority(b.boostPlan) - getBoostPriority(a.boostPlan);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">
      {/* ... header ... */}
      <div className="px-4 -mt-6 relative z-20 flex flex-col gap-5">
        {sortedAds.length > 0 ? (
          sortedAds.map((ad) => {
            const isFav = favorites.some(f => f.id === ad.id);
            const ribbon = getBoostRibbon(ad.boostPlan);

            return (
              <div
                key={ad.id}
                onClick={() => onAdClick(ad)}
                className={`bg-white rounded-3xl shadow-lg border-2 overflow-hidden cursor-pointer active:scale-[0.98] transition-all group relative ${
                  ad.boostPlan === 'max' ? 'border-yellow-400 ring-2 ring-yellow-400/20' :
                  ad.boostPlan === 'pro' ? 'border-cyan-400' : 'border-gray-100'
                }`}
              >
                {/* Visual Ribbon Sash */}
                {ribbon && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
                    <div className={`absolute top-4 -left-12 bg-gradient-to-r ${ribbon.gradient} text-white text-[10px] font-black px-12 py-1 transform -rotate-45 shadow-md border-y border-white/20 flex items-center justify-center gap-1 w-40 text-center uppercase`}>
                      {ribbon.label}
                    </div>
                  </div>
                )}

                <div className="relative h-56 w-full">
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />

                  {/* Top Right Actions */}
                  <div className="absolute top-3 right-3 flex gap-2 z-30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(ad);
                      }}
                      className="p-2.5 bg-white/90 backdrop-blur-md rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Gradient Overlay for Text Visibility */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
                    <div>
                      <span className="text-xs font-medium opacity-90 block mb-0.5">{ad.category?.toUpperCase() || 'VEÍCULO'}</span>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1 text-shadow-sm">{ad.title}</h3>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <PriceTag value={ad.price} />
                    {ad.boostPlan === 'Premium' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                        <Trophy className="w-3 h-3 fill-current" /> Recomendado
                      </span>
                    )}
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-xs font-medium bg-gray-50 p-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{ad.year}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-xs font-medium bg-gray-50 p-2 rounded-lg">
                      <Gauge className="w-4 h-4 text-gray-400" />
                      <span>{ad.mileage ? `${ad.mileage} km` : '0 km'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-gray-400 text-xs font-medium border-t border-gray-100 pt-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{ad.location}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Star className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-medium text-center">Nenhum veículo em destaque no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};
