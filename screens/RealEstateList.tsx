import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, Heart, MapPin, Key, ChevronRight, X, Check, DollarSign, Ruler, ArrowRight, Home, Building, Trees, Briefcase, Star, Trophy } from 'lucide-react';
import { Header, PriceTag, HighlightRibbon } from '../components/Shared';
import { AdItem, FilterContext, AdStatus, RealEstatePromotion, Screen } from '../types';
import { REAL_ESTATE_PROMO_BANNERS } from '../constants';
import { PromoCarousel } from '../components/HomeSections/PromoCarousel';
import { Footer } from '../components/Footer';
import { Skeleton } from '../components/ui/Skeleton';
import { SmartImage } from '../components/ui/SmartImage';
import AdManager from '../services/AdManager';

const adManager = AdManager.getInstance();
import { getBoostPriority, getBoostRibbon, getBoostBorderClass } from '../utils/boostRibbon';
import { AdMobBanner } from '../components/ui/AdMobBanner';
import { api, USE_NEW_API } from '../services/api';

interface RealEstateListProps {
  ads: AdItem[];
  onBack: () => void;
  onAdClick: (ad: AdItem) => void;
  favorites: AdItem[];
  onToggleFavorite: (ad: AdItem) => void;
  filterContext?: FilterContext | null;
  onClearFilter?: () => void;
  promotions?: RealEstatePromotion[];
  onNavigate?: (screen: Screen) => void;
  user?: any;
  currentScreen?: Screen;
}

const PROPERTY_TYPES = ['Casa', 'Apartamento', 'Terreno', 'Comercial'];
const AMENITIES_OPTIONS = [
  'Garagem', 'Piscina', 'Churrasqueira', 'Varanda',
  'Academia', 'Ar Condicionado', 'Elevador', 'Portaria 24h'
];

const PROPERTY_QUICK_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'Casa', label: 'Casas' },
  { id: 'Apartamento', label: 'Apartamentos' },
  { id: 'Terreno', label: 'Terrenos' },
  { id: 'Comercial', label: 'Comercial' },
];

import { AdCardSkeleton } from '../components/skeletons/AdCardSkeleton';

export const RealEstateList: React.FC<RealEstateListProps> = ({ ads, onBack, onAdClick, favorites, onToggleFavorite, filterContext, onClearFilter, promotions = [], onNavigate, user, currentScreen }) => {
  const [transactionType, setTransactionType] = useState<'all' | 'sale' | 'rent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('todos');
  const [isTrending, setIsTrending] = useState(false);

  // Filter Modal State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(adManager.isBannerActive());

  useEffect(() => {
    return adManager.onBannerStateChange((visible) => {
      setIsBannerVisible(visible);
    });
  }, []);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // Complex Filter State
  const [filters, setFilters] = useState({
    location: '',
    propertyType: [] as string[],
    minPrice: '',
    maxPrice: '',
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    minArea: '',
    maxArea: '',
    amenities: [] as string[]
  });

  // --- NOVA LÓGICA DE PAGINAÇÃO (FASE 7) ---
  const [pagedAds, setPagedAds] = useState<AdItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 12;

  // Carregamento de Dados (Backend-side)
  const loadMoreData = async (reset = false) => {
    if (!USE_NEW_API || loading || (!hasMore && !reset)) return;

    setLoading(true);
    const nextOffset = reset ? 0 : page * ITEMS_PER_PAGE;

    try {
      const results = await api.getAdsList({
        limit: ITEMS_PER_PAGE,
        offset: nextOffset,
        category: 'imoveis',
        searchTerm: searchTerm,
        filters: {
          ...filters,
          transactionType: transactionType !== 'all' ? transactionType : undefined,
          realEstateType: selectedPropertyType !== 'todos' ? selectedPropertyType : undefined
        }
      });

      if (results.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setPagedAds(prev => reset ? results : [...prev, ...results]);
      setPage(prev => reset ? 1 : prev + 1);
    } catch (error) {
      console.error("❌ Erro ao carregar imóveis:", error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger: Quando os filtros mudam, resetamos a lista
  useEffect(() => {
    if (USE_NEW_API) {
      loadMoreData(true);
    }
  }, [searchTerm, transactionType, selectedPropertyType, filters]);


  // Handle Filter Context
  useEffect(() => {
    if (filterContext?.mode === 'trending') {
      setIsTrending(true);
      if (onClearFilter) onClearFilter();
    }
  }, [filterContext]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setShowSearchSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // --- HELPERS ---
  const toggleFilterArray = (field: 'propertyType' | 'amenities', value: string) => {
    setFilters(prev => {
      const list = prev[field];
      if (list.includes(value)) {
        return { ...prev, [field]: list.filter(item => item !== value) };
      } else {
        if (field === 'propertyType') {
          // Mantendo visualmente como seleção única para simplificar, mas a lógica suporta array
          return { ...prev, [field]: [value] };
        }
        return { ...prev, [field]: [...list, value] };
      }
    });
    setHasUserInteracted(true);
  };

  // Formatting helpers - Simplified for Real Estate (No decimals usually needed for input)
  const formatNumber = (val: string) => {
    const num = val.replace(/\D/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('pt-BR');
  };

  const parseNumber = (val: string) => {
    if (!val) return 0;
    return Number(val.replace(/\./g, ''));
  };

  // --- FILTERING LOGIC ---
  const filteredAds = useMemo(() => {
    const filtered = ads.filter(ad => {
      // Status (Relaxed for mocks)
      if (ad.status !== AdStatus.ACTIVE) return false;
      
      // Transaction Type Filtering (Strict)
      if (transactionType !== 'all') {
        const adType = (ad.transactionType || '').toLowerCase();
        if (adType !== transactionType) return false;
      }

      // 2. Quick Filter (Tabs)
      if (selectedPropertyType !== 'todos') {
        if (ad.realEstateType !== selectedPropertyType) return false;
      }

      // 3. Search Bar (Main Screen)
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const matchTitle = ad.title.toLowerCase().includes(lower);
        const matchLoc = ad.location.toLowerCase().includes(lower);
        if (!matchTitle && !matchLoc) return false;
      }

      // 4. Modal Filters

      // Location (Modal)
      if (filters.location) {
        if (!ad.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }

      // Property Type (Modal - works in conjunction with quick filter)
      if (filters.propertyType.length > 0) {
        if (!ad.realEstateType || !filters.propertyType.includes(ad.realEstateType)) return false;
      }

      // Price
      const price = ad.price;
      const minP = parseNumber(filters.minPrice);
      const maxP = parseNumber(filters.maxPrice);
      if (minP > 0 && price < minP) return false;
      if (maxP > 0 && price > maxP) return false;

      // Bedrooms (Mínimo de)
      if (filters.bedrooms !== null) {
        const adBeds = ad.bedrooms || 0;
        // Use >= para garantir que se o usuário pede 2, mostre imóveis com 3, 4, etc.
        if (adBeds < filters.bedrooms) return false;
      }

      // Bathrooms (Mínimo de)
      if (filters.bathrooms !== null) {
        const adBaths = ad.bathrooms || 0;
        if (adBaths < filters.bathrooms) return false;
      }

      // Area
      const area = ad.area || 0;
      const minA = parseNumber(filters.minArea);
      const maxA = parseNumber(filters.maxArea);
      if (minA > 0 && area < minA) return false;
      if (maxA > 0 && area > maxA) return false;

      // Amenities (AND logic)
      if (filters.amenities.length > 0) {
        const adFeatures = ad.features || [];
        const hasAll = filters.amenities.every(am => adFeatures.includes(am));
        if (!hasAll) return false;
      }

      return true;
    });

    if (isTrending) {
      return filtered.sort((a, b) => {
        const scoreA = (a.views || 0) + (a.favoriteCount || 0) * 5 + (a.chatCount || 0) * 10 + (getBoostPriority(a.boostPlan) * 500);
        const scoreB = (b.views || 0) + (b.favoriteCount || 0) * 5 + (b.chatCount || 0) * 10 + (getBoostPriority(b.boostPlan) * 500);
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [ads, transactionType, searchTerm, filters, selectedPropertyType, isTrending]);

  const feedItems = USE_NEW_API ? pagedAds : filteredAds;

  const searchSuggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return ads.filter(ad =>
      ad.status === AdStatus.ACTIVE &&
      ad.category === 'imoveis' &&
      (ad.transactionType || 'sale') === transactionType &&
      ad.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6);
  }, [ads, searchTerm, transactionType]);

  const isPromotionVisible = (promo: RealEstatePromotion) => {
    const today = new Date();
    return promo.active &&
      today >= new Date(promo.startDate) &&
      today <= new Date(promo.endDate);
  };

  const carouselBanners = useMemo(() => {
    const activePromos = promotions
      .filter(isPromotionVisible)
      .sort((a, b) => a.order - b.order)
      .map(p => ({
        id: p.id,
        title: p.title || '',
        subtitle: p.subtitle,
        image: p.image,
        ctaText: 'VER MAIS',
        link: p.link
      }));

    return activePromos.length > 0 ? activePromos : REAL_ESTATE_PROMO_BANNERS;
  }, [promotions]);

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.location) count++;
    if (filters.propertyType.length) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.bedrooms !== null) count++;
    if (filters.bathrooms !== null) count++;
    if (filters.minArea || filters.maxArea) count++;
    count += filters.amenities.length;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      location: '',
      propertyType: [],
      minPrice: '',
      maxPrice: '',
      bedrooms: null,
      bathrooms: null,
      minArea: '',
      maxArea: '',
      amenities: []
    });
    setHasUserInteracted(false);
  };

  // --- RENDER HELPERS ---

  const NumericSelector = ({
    value,
    onChange
  }: {
    value: number | null,
    onChange: (v: number | null) => void
  }) => (
    <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200">
      {[1, 2, 3, 4].map((num) => {
        const isSelected = value === num;
        return (
          <button
            key={num}
            onClick={() => {
              onChange(isSelected ? null : num);
              setHasUserInteracted(true);
            }}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${isSelected
              ? 'bg-white text-primary shadow-sm border border-gray-100 ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {num}{num === 4 ? '+' : ''}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-[110px]">
      <Header
        title="Imóveis"
        onBack={onBack}
        rightElement={
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${activeFiltersCount > 0
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-primary border border-primary/20 hover:bg-blue-50'
              }`}
          >
            <span className="text-sm font-bold">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white text-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        }
      />

      <div className="bg-white px-4 pt-2 pb-4 border-b border-gray-100 relative z-10">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setTransactionType('all');
              setHasUserInteracted(true);
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${transactionType === 'all'
              ? 'bg-white shadow-md text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => {
              setTransactionType('sale');
              setHasUserInteracted(true);
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${transactionType === 'sale'
              ? 'bg-white shadow-md text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Comprar
          </button>
          <button
            onClick={() => {
              setTransactionType('rent');
              setHasUserInteracted(true);
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${transactionType === 'rent'
              ? 'bg-white shadow-md text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Alugar
          </button>
        </div>
      </div>

      {/* Search & Results Header */}
      <div className="px-4 py-4 relative z-40" onClick={(e) => e.stopPropagation()}>
        <div className="relative mb-2">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Buscar em ${transactionType === 'all' ? 'Todos' : (transactionType === 'sale' ? 'Comprar' : 'Alugar')}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setHasUserInteracted(true);
              setShowSearchSuggestions(true);
            }}
            onFocus={() => setShowSearchSuggestions(true)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>

        {/* Sugestões de Busca */}
        {showSearchSuggestions && searchTerm.length >= 2 && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[500]">
            {searchSuggestions.map((ad, index) => (
              <button
                key={`suggestion-${ad.id}`}
                onClick={() => {
                  onAdClick(ad);
                  setShowSearchSuggestions(false);
                }}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${index !== searchSuggestions.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
              >
                <SmartImage 
                  src={ad.image} 
                  thumbnailSrc={ad.thumbnail_url}
                  alt={ad.title} 
                  className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" 
                />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-bold text-gray-900 truncate">{ad.title}</p>
                  <p className="text-primary font-medium">
                    {ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Promotional Carousel */}
      <div className="mb-2">
        <PromoCarousel banners={carouselBanners} />
      </div>

      {/* Property Type Quick Filters (NEW) */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar mb-2 relative z-0">
        {PROPERTY_QUICK_FILTERS.map((group) => (
          <button
            key={group.id}
            onClick={() => {
              setSelectedPropertyType(group.id);
              setHasUserInteracted(true);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${selectedPropertyType === group.id
              ? 'bg-primary text-white border-primary shadow-md'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="px-4 flex flex-col gap-4">
        <p className="text-sm font-bold text-gray-700 ml-1 mb-0">
          {loading && feedItems.length === 0 ? 'Buscando imóveis...' : `${USE_NEW_API && hasMore ? 'Mais de ' : ''}${feedItems.length} imóveis encontrados`}
        </p>

        {loading && feedItems.length === 0 ? (
          [1, 2, 3].map(i => <AdCardSkeleton key={i} variant="vertical" />)
        ) : feedItems.length > 0 ? (
          <>
            {feedItems.map((item) => {
            // Se for um slot de anúncio (Regra #3)

            const ad = item;
            const isFav = favorites.some(f => f.id === ad.id);
            const isTurboActive = ad.turbo_expires_at && new Date(ad.turbo_expires_at) > new Date();
            const borderClass = getBoostBorderClass(ad.boostPlan, !!isTurboActive);

            return (
              <div
                key={ad.id}
                onClick={() => onAdClick(ad)}
                className={`bg-white rounded-2xl shadow-sm border ${borderClass} overflow-hidden cursor-pointer active:scale-[0.99] transition-all group animate-fadeIn`}
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <SmartImage
                    src={ad.image}
                    thumbnailSrc={ad.thumbnail_url}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                    skeletonClassName="h-56 w-full"
                  />
                  
                  <HighlightRibbon ad={ad} />

                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(ad);
                      }}
                      className="p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Tag Category */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                      {ad.realEstateType}
                    </span>
                    {ad.transactionType && (
                      <span className={`backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg shadow-sm ${ad.transactionType.toLowerCase() === 'rent' ? 'bg-blue-600/90' : 'bg-green-600/90'}`}>
                        {ad.transactionType.toLowerCase() === 'rent' ? 'Aluguel' : 'Venda'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">{ad.title}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-xs font-medium mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{ad.location}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                    <div>
                      <PriceTag value={ad.price} />
                      {ad.transactionType === 'rent' && <span className="text-gray-400 text-xs">/mês</span>}
                    </div>
                    {ad.area && (
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mr-1">Área</span>
                        <span className="text-gray-700 font-bold">{ad.area}m²</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Botão Carregar Mais (Infinite Scroll Manual) */}
          {USE_NEW_API && hasMore && (
            <button
              onClick={() => loadMoreData()}
              disabled={loading}
              className="w-full py-4 bg-white border border-gray-200 rounded-2xl text-primary font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  Carregar mais imóveis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </>
      ) : (
          <div className="col-span-1 sm:col-span-2 py-12 flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-gray-500 max-w-xs leading-relaxed">
              {transactionType === 'rent'
                ? "Ainda não temos muitos imóveis para aluguel. Seja o primeiro a anunciar!"
                : "Não encontramos imóveis com os filtros selecionados. Tente ajustar sua busca."}
            </p>
            {hasUserInteracted && (
              <button
                onClick={clearFilters}
                className="mt-6 text-primary font-bold hover:underline"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- FILTER MODAL (FIXED PROPORTIONS) --- */}
      {
        isFilterOpen && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsFilterOpen(false)} />

            {/* Modal Container - Max Width applied here to fix proportionality */}
            <div 
              className="bg-white w-full max-w-md h-[92vh] rounded-t-[30px] shadow-2xl relative animate-slide-in-from-bottom flex flex-col overflow-hidden transition-all duration-300"
              style={{ bottom: isBannerVisible ? '50px' : '0px' }}
            >

              {/* Header do Filtro */}
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                <button onClick={() => setIsFilterOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                  <X className="w-6 h-6 text-gray-800" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">Filtrar Imóveis</h2>
                <button onClick={clearFilters} className="text-primary text-sm font-bold hover:opacity-80">
                  Limpar
                </button>
              </div>

              {/* Conteúdo Scrollável */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                {/* ... existing filter sections ... */}
                {/* 1. Localização */}
                <section>
                  <label className="text-sm font-bold text-gray-900 mb-3 block">Localização</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Busque por cidade ou bairro"
                      value={filters.location}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, location: e.target.value }));
                        setHasUserInteracted(true);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-800 focus:outline-none focus:border-primary font-medium"
                    />
                  </div>
                </section>

                {/* 2. Tipo de Imóvel */}
                <section>
                  <label className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide block">TIPO DE IMÓVEL</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {PROPERTY_TYPES.map(type => {
                      const isSelected = filters.propertyType.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleFilterArray('propertyType', type)}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${isSelected
                            ? 'bg-primary border-primary text-white shadow-md shadow-blue-200'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {type}
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* 3. Preço */}
                <section>
                  <label className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide block">PREÇO</label>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <span className="text-xs text-gray-400 font-medium mb-1 block">Mínimo</span>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500 font-medium text-sm">R$</span>
                        <input
                          type="text" inputMode="numeric"
                          value={filters.minPrice}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length > 12) return;
                            setFilters(p => ({ ...p, minPrice: formatNumber(e.target.value) }));
                            setHasUserInteracted(true);
                          }}
                          maxLength={16}
                          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 font-bold text-gray-800 focus:border-primary outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-400 font-medium mb-1 block">Máximo</span>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500 font-medium text-sm">R$</span>
                        <input
                          type="text" inputMode="numeric"
                          value={filters.maxPrice}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length > 12) return;
                            setFilters(p => ({ ...p, maxPrice: formatNumber(e.target.value) }));
                            setHasUserInteracted(true);
                          }}
                          maxLength={16}
                          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 font-bold text-gray-800 focus:border-primary outline-none"
                          placeholder="Sem limite"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Slider Visual Only */}
                  <div className="relative h-1.5 bg-gray-200 rounded-full mx-1">
                    <div className="absolute left-0 right-0 top-0 bottom-0 bg-primary rounded-full opacity-20"></div>
                    <div className="absolute left-[10%] right-[30%] top-0 bottom-0 bg-primary rounded-full"></div>
                    <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm"></div>
                    <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                </section>

                {/* 4. Quartos e Banheiros */}
                <section>
                  <label className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide block">QUARTOS E BANHEIROS</label>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Quartos</p>
                    <NumericSelector
                      value={filters.bedrooms}
                      onChange={(val) => setFilters(p => ({ ...p, bedrooms: val }))}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Banheiros</p>
                    <NumericSelector
                      value={filters.bathrooms}
                      onChange={(val) => setFilters(p => ({ ...p, bathrooms: val }))}
                    />
                  </div>
                </section>

                {/* 5. Área */}
                <section>
                  <label className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide block">ÁREA (m²)</label>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <span className="text-xs text-gray-400 font-medium mb-1 block">Mínima</span>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text" inputMode="numeric"
                          value={filters.minArea}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length > 8) return;
                            setFilters(p => ({ ...p, minArea: formatNumber(e.target.value) }));
                            setHasUserInteracted(true);
                          }}
                          maxLength={10}
                          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 font-bold text-gray-800 focus:border-primary outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-400 font-medium mb-1 block">Máxima</span>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text" inputMode="numeric"
                          value={filters.maxArea}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length > 8) return;
                            setFilters(p => ({ ...p, maxArea: formatNumber(e.target.value) }));
                            setHasUserInteracted(true);
                          }}
                          maxLength={10}
                          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 font-bold text-gray-800 focus:border-primary outline-none"
                          placeholder="Sem limite"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 6. Comodidades */}
                <section>
                  <label className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide block">COMODIDADES</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AMENITIES_OPTIONS.map(amenity => {
                      const isChecked = filters.amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          onClick={() => toggleFilterArray('amenities', amenity)}
                          className="flex items-center gap-3 p-1 group"
                        >
                          <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                            {isChecked && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <span className={`text-sm ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {amenity}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

              </div>

              {/* Footer Button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {hasUserInteracted 
                    ? `Ver resultados (${filteredAds.length})` 
                    : "Ver resultados"
                  }
                </button>
              </div>

            </div>
          </div>
        )
      }

      <AdMobBanner user={user} currentScreen={currentScreen} />
      <Footer onNavigate={onNavigate} />

    </div >
  );
};
