import React, { useMemo } from 'react';
import { Home, ChevronRight, TrendingUp, BedDouble, Ruler } from 'lucide-react';
import { AdItem, Screen } from '../../types';

import { SmartImage } from '../ui/SmartImage';
import { HorizontalAdCardSkeleton } from '../../screens/Dashboard';

interface TrendingRealEstateProps {
    ads?: AdItem[];
    onAdClick: (ad: AdItem) => void;
    onNavigate: (screen: Screen) => void;
    onViewAll: () => void;
}

export const TrendingRealEstateSection: React.FC<TrendingRealEstateProps> = ({ ads, onAdClick, onNavigate, onViewAll }) => {

    const trendingAds = useMemo(() => {
        // Filter Real Estate
        const realEstate = ads.filter(ad => ad.category === 'imoveis');

        // Score Logic
        const scoredAds = realEstate.map(ad => {
            let score = 0;
            score += (ad.views || 0) * 1;
            score += (ad.favoriteCount || 0) * 5;
            score += (ad.chatCount || 0) * 10;

            // Boost priority calculate
            if (ad.boostPlan === 'premium') score += 1000;
            else if (ad.boostPlan === 'advanced') score += 500;

            return { ad, score };
        });

        // Sort by Score Descending
        return scoredAds.sort((a, b) => b.score - a.score).map(item => item.ad);
    }, [ads]);

    if (ads === undefined) {
        return (
            <div className="mb-8">
                <div className="px-4 mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 text-lg uppercase tracking-tighter">Imóveis em Alta</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
                    {[1, 2, 3].map(i => <HorizontalAdCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (trendingAds.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="px-4 mb-4 flex items-center justify-between">
                <div
                    onClick={onViewAll}
                    className="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
                >
                    <h2 className="font-bold text-gray-900 text-lg leading-tight flex items-center gap-1">
                        Imóveis em Alta
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </h2>
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
                {trendingAds.map((estate, index) => (
                    <div
                        key={estate.id}
                        onClick={() => onAdClick(estate)}
                        className="min-w-[220px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-start cursor-pointer hover:shadow-md transition-shadow group relative"
                    >
                        {/* Badge TOP */}
                        {index < 3 && (
                            <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm">
                                TOP {index + 1}
                            </div>
                        )}

                        <div className="h-32 w-full relative">
                            <SmartImage
                                src={estate.image}
                                alt={estate.title}
                                className="w-full h-full object-cover"
                                skeletonClassName="h-32 w-full"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <p className="text-white font-bold text-lg">
                                    {estate.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>

                        <div className="p-3">
                            <h3 className="font-medium text-gray-800 text-sm line-clamp-1 mb-2">{estate.title}</h3>

                            <div className="flex items-center gap-3 text-gray-500 text-xs">
                                {estate.area && (
                                    <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-1 rounded">
                                        <Ruler className="w-3 h-3" />
                                        <span>{estate.area}m²</span>
                                    </div>
                                )}
                                {estate.bedrooms !== undefined && (
                                    <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-1 rounded">
                                        <BedDouble className="w-3 h-3" />
                                        <span>{estate.bedrooms}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={onViewAll || (() => onNavigate(Screen.REAL_ESTATE_LIST))}
                    className="min-w-[100px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 snap-start hover:bg-gray-50"
                >
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-orange-600">Ver tudo</span>
                </button>
            </div>
        </div>
    );
};
