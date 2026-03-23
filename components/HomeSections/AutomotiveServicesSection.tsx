
import React from 'react';
import { Wrench, ChevronRight, MapPin } from 'lucide-react';
import { AdItem, Screen } from '../../types';

import { SmartImage } from '../ui/SmartImage';
import { AdCardSkeleton } from '../skeletons/AdCardSkeleton';
import { getBoostRibbon } from '../../utils/boostRibbon';

interface AutomotiveServicesProps {
    ads?: AdItem[];
    onAdClick: (ad: AdItem) => void;
    onNavigate: (screen: Screen) => void;
    onViewAll: () => void;
}

export const AutomotiveServicesSection: React.FC<AutomotiveServicesProps> = ({ ads, onAdClick, onNavigate, onViewAll }) => {
    const serviceAds = ads?.filter(ad => ad.category === 'servicos') || [];

    if (ads === undefined) {
        return (
            <div className="mb-8">
                <div className="px-4 mb-4 flex items-center gap-2">
                    <div className="bg-purple-100 p-2 rounded-full">
                        <Wrench className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg">Serviços</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
                    {[1, 2, 3].map(i => <AdCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (serviceAds.length === 0) return null;

    return (
        <div className="mb-8">
            <div
                onClick={onViewAll}
                className="px-4 mb-4 flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
            >
                <div className="bg-purple-100 p-2 rounded-full">
                    <Wrench className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                    <h2 className="font-bold text-gray-900 text-lg leading-none flex items-center gap-1">
                        Serviços Automotivos
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Cuidando do seu carro</p>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
                {serviceAds.map((service) => {
                    const ribbon = getBoostRibbon(service.boostPlan || 'none');
                    let borderColor = "border-gray-100";
                    if (ribbon) {
                        borderColor = service.boostPlan === 'max' ? "border-yellow-400 ring-1 ring-yellow-400" :
                            service.boostPlan === 'pro' ? "border-cyan-400" : "border-gray-200";
                    }

                    return (
                        <div
                            key={service.id}
                            onClick={() => onAdClick(service)} // Main click for details
                            className={`min-w-[160px] w-[160px] bg-white rounded-xl shadow-sm border ${borderColor} overflow-hidden snap-start cursor-pointer hover:shadow-md transition-shadow relative animate-fadeIn`}
                        >
                            <div className="h-28 w-full relative overflow-hidden">
                                <SmartImage
                                    src={service.image}
                                    alt={service.title}
                                    className="w-full h-full object-cover"
                                    skeletonClassName="h-28 w-full"
                                />
                                
                                {ribbon && (
                                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30">
                                        <div className={`absolute top-2 -left-10 bg-gradient-to-r ${ribbon.gradient} text-white text-[8px] font-black px-10 py-1 transform -rotate-45 shadow-sm border-y border-white/20 flex items-center justify-center uppercase tracking-wider`}>
                                            {ribbon.label}
                                        </div>
                                    </div>
                                )}

                                <div className={`absolute top-2 right-2 ${ribbon ? 'opacity-90' : ''} bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-gray-700`}>
                                    {service.partType || 'Serviço'}
                                </div>
                            </div>

                        <div className="p-3">
                            <h3 className="font-bold text-gray-800 text-sm line-clamp-1 mb-1">{service.title}</h3>

                            {service.estimatedTime && (
                                <div className="flex items-center gap-1 mb-3">
                                    <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                        ⏱ {service.estimatedTime}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-1 mt-auto bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] text-gray-500 truncate font-medium">
                                    {service.location}
                                </span>
                            </div>
                        </div>
                    </div>
                  );
                })}

                <button
                    onClick={onViewAll || (() => onNavigate(Screen.PARTS_SERVICES_LIST))}
                    className="min-w-[100px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 snap-start hover:bg-gray-50"
                >
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-purple-600">Ver tudo</span>
                </button>
            </div>
        </div>
    );
};

