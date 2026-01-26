import React, { useMemo } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { AdItem, AdStatus, Screen } from '../../types';

interface PersonalizedFeedProps {
    ads: AdItem[];
    onAdClick: (ad: AdItem) => void;
    onNavigate: (screen: Screen) => void;
    onViewAll?: () => void;
}

export const PersonalizedFeedSection: React.FC<PersonalizedFeedProps> = ({ ads, onAdClick, onNavigate, onViewAll }) => {
    // Logic to filter and mix ads
    const feedAds = useMemo(() => {
        // Filter eligible ads - Simplified for more volume
        const eligibleAds = ads.filter(ad => {
            // Status validity
            if (ad.status !== AdStatus.ACTIVE) return false;

            // Optional: Filter by category here if needed, but we do it below
            return true;
        });

        // Categorize
        const autos = eligibleAds.filter(ad => ad.category === 'autos' || ad.category === 'veiculos');

        // Create final list with more vehicles (increased from 10 to 20)
        const selectedAds = [
            ...autos.slice(0, 20)
        ];

        // Sort by date descending
        return selectedAds.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

    }, [ads]);

    if (feedAds.length === 0) return null;

    return (
        <div className="mb-8 animate-in slide-in-from-right duration-500">
            <div className="px-4 mb-4 flex justify-between items-end">
                <div
                    onClick={onViewAll}
                    className="cursor-pointer active:opacity-70 transition-opacity"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h2 className="font-bold text-gray-900 text-lg leading-tight flex items-center gap-1">
                            Sugestões para Você
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </h2>
                    </div>
                    <p className="text-xs text-gray-500">Novidades recentes selecionadas</p>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
                {feedAds.map((ad) => (
                    <div
                        key={ad.id}
                        onClick={() => onAdClick(ad)}
                        className="min-w-[160px] w-[160px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-start cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                    >
                        <div className="h-28 w-full relative bg-gray-100">
                            <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                            {ad.category === 'autos' && (
                                <span className="absolute bottom-0 right-0 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-tl-lg backdrop-blur-sm">
                                    {ad.year}
                                </span>
                            )}
                        </div>
                        <div className="p-2.5">
                            <h3 className="font-semibold text-gray-800 text-xs line-clamp-2 h-8 mb-1 leading-snug">{ad.title}</h3>
                            <p className="font-bold text-primary text-sm">
                                {ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-1 truncate flex items-center gap-1">
                                {ad.location}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
