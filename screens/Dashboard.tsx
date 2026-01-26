
import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Bell, Car, Home, ChevronRight, Wrench, Smartphone, ArrowRight, Sparkles, Star, Map, Camera
} from 'lucide-react';
import { Screen, User, AdItem, DashboardPromotion } from '../types';
import { POPULAR_REAL_ESTATE, POPULAR_SERVICES, POPULAR_CARS, APP_LOGOS, PROMO_BANNERS } from '../constants';

interface DashboardProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onAdClick?: (ad: AdItem) => void;
  adsAtFair?: AdItem[]; // Veículos na feira
  featuredAds?: AdItem[]; // Veículos em destaque (Dinâmico)
  recentVehicles?: AdItem[]; // Veículos gerais (incluindo do usuário)
  fairActive?: boolean; // Controls global visibility of the Fair section
  onOpenNewArrivals: () => void;
  onOpenServices: () => void;
  onOpenTrending: () => void;
  serviceAds?: AdItem[]; // Lista unificada de serviços
  dashboardPromotions?: DashboardPromotion[]; // Nova prop
}

const isPromotionVisible = (promo: DashboardPromotion): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(promo.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(promo.endDate);
  end.setHours(23, 59, 59, 999);

  return promo.active && today >= start && today <= end;
};

// Category Button Component
const CategoryItem: React.FC<{
  icon: React.ReactNode,
  label: string,
  badge?: string,
  onClick?: () => void
}> = ({ icon, label, badge, onClick }) => (
  <button
    onClick={onClick}
    disabled={!!badge}
    className={`flex flex-col items-center gap-2 w-full transition-opacity group ${badge ? 'cursor-default' : 'active:opacity-70'}`}
  >
    <div className="w-full aspect-square max-w-[70px] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-primary group-hover:border-accent group-hover:shadow-md transition-all relative overflow-visible">
      {icon}
      {badge && (
        <div className="absolute -top-3 -right-3 z-20 animate-pulse">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white transform rotate-3 whitespace-nowrap tracking-wide">
            {badge.toUpperCase()}!
          </div>
        </div>
      )}
    </div>
    <span className={`text-[10px] font-bold text-center leading-tight px-1 ${badge ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
  </button>
);

// Horizontal Ad Card with logic for different boost plans
const HorizontalAdCard: React.FC<{ ad: AdItem, onClick?: () => void }> = ({ ad, onClick }) => {

  // Determine Boost Styles
  let boostBadge = null;
  let borderColor = "border-gray-100";

  if (ad.boostPlan === 'premium') {
    borderColor = "border-yellow-400 ring-1 ring-yellow-400";
    boostBadge = (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-3 -left-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white text-[9px] font-black px-6 py-1 transform -rotate-45 shadow-md border-y border-white/20 z-20 flex items-center justify-center">
          TURBO MÁX
        </div>
      </div>
    );
  } else if (ad.boostPlan === 'advanced') {
    borderColor = "border-cyan-400";
    boostBadge = (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-3 -left-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-[9px] font-black px-6 py-1 transform -rotate-45 shadow-md border-y border-white/20 z-20 flex items-center justify-center">
          TURBO ÁGIL
        </div>
      </div>
    );
  } else if (ad.boostPlan === 'basic' || ad.isFeatured) {
    // Basic or Legacy isFeatured
    boostBadge = (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-3 -left-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-[9px] font-black px-6 py-1 transform -rotate-45 shadow-md border-y border-white/20 z-20 flex items-center justify-center">
          TURBO
        </div>
      </div>
    );
  }

  // Count photos
  const imageCount = ad.images?.length || 1;

  return (
    <div
      onClick={onClick}
      className={`min-w-[160px] w-[160px] bg-white rounded-xl shadow-sm overflow-hidden snap-start cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] relative border ${borderColor}`}
    >
      <div className="h-28 w-full relative">
        <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
        {boostBadge}

        {/* Photo Counter Badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-30 shadow-sm border border-white/10">
          <Camera className="w-3 h-3" />
          <span>{imageCount}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-800 text-sm line-clamp-2 h-10 leading-snug mb-1">{ad.title}</h3>
        <p className="font-bold text-gray-900 text-base">
          {ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
        </p>
        <p className="text-[10px] text-gray-400 mt-1 truncate">
          {ad.vehicleType ? `${ad.year} • ${ad.mileage}km` : ad.location}
        </p>
      </div>
    </div>
  );
};

import { PersonalizedFeedSection } from '../components/HomeSections/PersonalizedFeedSection';
import { AutomotiveServicesSection } from '../components/HomeSections/AutomotiveServicesSection';
import { TrendingRealEstateSection } from '../components/HomeSections/TrendingRealEstateSection';
import { PromoCarousel } from '../components/HomeSections/PromoCarousel';
import { Footer } from '../components/Footer';

// ... (HorizontalAdCard and CategoryItem definitions remain unchanged) ...

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onNavigate,
  onAdClick,
  adsAtFair = [],
  featuredAds = [],
  recentVehicles = POPULAR_CARS, // Default to popular if not provided
  trendingRealEstate = POPULAR_REAL_ESTATE, // Default to constants
  fairActive = true, // Default to true if not provided
  onOpenNewArrivals,
  onOpenServices,
  onOpenTrending,
  serviceAds = POPULAR_SERVICES,
  dashboardPromotions = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');


  // --- LÓGICA DE BUSCA GLOBAL ---
  const allSearchableData = [...featuredAds, ...recentVehicles, ...trendingRealEstate, ...POPULAR_SERVICES];

  const searchSuggestions = searchTerm.length >= 3
    ? allSearchableData.filter(ad =>
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.category?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6)
    : [];
  // ------------------------------

  // --- SORTING LOGIC FOR FEATURED ---
  const getBoostPriority = (plan?: string) => {
    if (plan === 'premium') return 3;
    if (plan === 'advanced') return 2;
    if (plan === 'basic') return 1;
    return 0;
  };

  const sortedFeaturedVehicles = [...featuredAds].sort((a, b) => {
    return getBoostPriority(b.boostPlan) - getBoostPriority(a.boostPlan);
  });

  // --- DATASET COMBINADO PARA O FEED PERSONALIZADO ---
  const allDiscoveryAds = [...recentVehicles, ...trendingRealEstate, ...serviceAds];

  const handleAdClickWrapper = (ad: AdItem) => {
    // Logic to save viewed ad ID to localStorage for Personalized Feed
    try {
      const viewedAdsRaw = localStorage.getItem('viewed_ads');
      const viewedAds = viewedAdsRaw ? JSON.parse(viewedAdsRaw) : [];
      if (!viewedAds.includes(ad.id)) {
        const newViewed = [...viewedAds, ad.id];
        localStorage.setItem('viewed_ads', JSON.stringify(newViewed));
      }
    } catch (e) {
      console.error("Error saving view history", e);
    }

    if (onAdClick) onAdClick(ad);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in fade-in duration-300">

      {/* 1. Top Header */}
      <div className="bg-white px-4 pt-4 pb-2 sticky top-0 z-30 shadow-sm">
        <div className="flex justify-between items-center mb-4">

          {/* Logo Replacement */}
          <div className="flex items-center">
            <img
              src={APP_LOGOS.FULL}
              alt="Feirão da Orca"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Notification Button */}
          <button
            onClick={() => onNavigate(Screen.NOTIFICATIONS)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* Search Bar Container */}
        <div className="relative mb-2">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar em Todos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
          />

          {/* Autocomplete Dropdown */}
          {searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              {searchSuggestions.map((ad, index) => (
                <button
                  key={`search-${ad.id}`}
                  onClick={() => onAdClick && onAdClick(ad)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${index !== searchSuggestions.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                >
                  <img src={ad.image} alt={ad.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{ad.title}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-primary font-medium">
                        {ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </p>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded capitalize">
                        {ad.category}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Categories Grid */}
      <div className="bg-white pb-6 pt-4 px-4 shadow-[0_4px_10px_-5px_rgba(0,0,0,0.05)] rounded-b-3xl mb-4">
        <div className="grid grid-cols-4 gap-3">
          <CategoryItem
            icon={<Car className="w-6 h-6" />}
            label="Veículos"
            onClick={() => onNavigate(Screen.VEHICLES_LIST)}
          />
          <CategoryItem
            icon={<Home className="w-6 h-6" />}
            label="Imóveis"
            onClick={() => onNavigate(Screen.REAL_ESTATE_LIST)}
          />
          <CategoryItem
            icon={<Wrench className="w-6 h-6" />}
            label="Peças e Serviços"
            onClick={() => onNavigate(Screen.PARTS_SERVICES_LIST)}
          />
          <CategoryItem
            icon={<Smartphone className="w-6 h-6" />}
            label="Celulares"
            badge="Em breve"
            onClick={() => { }}
          />
        </div>
      </div>

      {/* 3. Promotional Carousel */}
      <div className="mb-2">
        <PromoCarousel
          banners={
            dashboardPromotions.length > 0
              ? dashboardPromotions
                .filter(isPromotionVisible)
                .sort((a, b) => a.order - b.order)
                .map(p => ({
                  id: p.id,
                  title: p.title || '',
                  subtitle: p.subtitle,
                  image: p.image,
                  ctaText: 'VER MAIS',
                  link: p.link
                }))
              : PROMO_BANNERS.map(p => ({ ...p, ctaText: p.ctaText || 'VER MAIS' }))
          }
          onPromoClick={(promo) => {
            if (promo.link && promo.link !== '#') {
              window.open(promo.link, '_blank');
            }
          }}
        />
      </div>


      {/* NEW SECTION: Veículos em Destaque (Dynamic from props) */}
      <div className="mb-8 pt-2 pb-4 bg-gradient-to-b from-yellow-50 to-transparent">
        <div
          className="px-4 mb-4 flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => onNavigate(Screen.FEATURED_VEHICLES_LIST)}
        >
          <div className="bg-yellow-100 p-2 rounded-full border border-yellow-200">
            <Star className="w-5 h-5 text-yellow-600 fill-current" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg leading-none flex items-center gap-1">
              Veículos em Destaque
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">As melhores ofertas selecionadas</p>
          </div>
        </div>

        {sortedFeaturedVehicles.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
            {sortedFeaturedVehicles.map((car) => (
              <HorizontalAdCard
                key={car.id}
                ad={car}
                onClick={() => onAdClick && onAdClick(car)}
              />
            ))}
            <button
              onClick={() => onNavigate(Screen.FEATURED_VEHICLES_LIST)}
              className="min-w-[100px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 snap-start hover:bg-gray-50 group"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-50 group-hover:bg-yellow-100 flex items-center justify-center text-yellow-600 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-yellow-700">Ver todos</span>
            </button>
          </div>
        ) : (
          <div className="mx-4 bg-white border border-gray-100 rounded-xl p-6 text-center text-gray-400 text-sm">
            Nenhum destaque no momento.
          </div>
        )}
      </div>

      {/* 4. Group: ESTOU NA FEIRA AGORA (CONDITIONAL RENDERING) */}
      {/* Exibir apenas se a funcionalidade estiver ativa pelo Admin E houver carros na feira */}
      {fairActive && adsAtFair.length > 0 && (
        <div className="mb-6 animate-in slide-in-from-right">
          <div
            onClick={() => onNavigate(Screen.FAIR_LIST)}
            className="px-4 mb-3 flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
          >
            <div className="bg-green-100 p-2 rounded-full relative">
              <Map className="w-5 h-5 text-green-600" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 text-lg leading-none flex items-center gap-1">
                Estou na feira agora
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Confira quem está por aqui ao vivo!</p>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
            {adsAtFair.map((car) => (
              <div
                key={`fair-${car.id}`}
                onClick={() => onAdClick && onAdClick(car)}
                className="min-w-[200px] bg-white rounded-2xl shadow-sm border-2 border-green-400 overflow-hidden snap-start cursor-pointer active:scale-[0.98] relative hover:shadow-md transition-shadow ring-2 ring-green-100"
              >
                <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  AO VIVO
                </div>

                <div className="h-32 w-full relative">
                  <img src={car.image} alt={car.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8">
                    <p className="text-white text-xs font-bold truncate">{car.vehicleType}</p>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{car.title}</h3>
                  <p className="text-primary font-bold">{car.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                  <p className="text--[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Na Feira
                  </p>
                </div>
              </div>
            ))}
            <button
              onClick={() => onNavigate(Screen.FAIR_LIST)}
              className="min-w-[100px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 snap-start hover:bg-green-50 group border-green-100"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 group-hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-green-700">Ver todos</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Personalized Feed (Sugestões para Você) */}
      <PersonalizedFeedSection
        ads={allDiscoveryAds}
        onAdClick={handleAdClickWrapper}
        onNavigate={onNavigate}
        onViewAll={onOpenNewArrivals}
      />

      {/* 6. Automotive Services */}
      <AutomotiveServicesSection
        ads={serviceAds}
        onAdClick={handleAdClickWrapper}
        onNavigate={onNavigate}
        onViewAll={onOpenServices}
      />

      {/* 7. Trending Real Estate */}
      <TrendingRealEstateSection
        ads={trendingRealEstate}
        onAdClick={handleAdClickWrapper}
        onNavigate={onNavigate}
        onViewAll={onOpenTrending}
      />

      {/* Footer */}
      <Footer onNavigate={onNavigate} />

    </div>
  );
};
