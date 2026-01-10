
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, Heart, Car, ChevronRight, X, Check, Gauge, Calendar, DollarSign, Fuel, Palette, Zap, Tag, Loader2, Edit3, ListFilter, Trophy, Star } from 'lucide-react';
import { Header, PriceTag } from '../components/Shared';
import { AdItem, FilterContext, AdStatus, VehiclesPromotion, Screen } from '../types';
import { fipeApi, FipeItem } from '../services/fipeApi';
import { VEHICLES_PROMO_BANNERS } from '../constants';
import { PromoCarousel } from '../components/HomeSections/PromoCarousel';
import { Footer } from '../components/Footer';

interface VehiclesListProps {
  ads: AdItem[];
  onBack: () => void;
  onAdClick: (ad: AdItem) => void;
  favorites: AdItem[];
  onToggleFavorite: (ad: AdItem) => void;
  filterContext?: FilterContext | null;
  onClearFilter?: () => void;
  promotions?: VehiclesPromotion[];
  onNavigate?: (screen: Screen) => void;
}

// Grupos de Veículos (Categorias)
const VEHICLE_GROUPS = [
  { id: 'todos', label: 'Todos' },
  { id: 'Moto', label: 'Motos' },
  { id: 'Caminhão', label: 'Caminhões' },
  { id: 'SUV', label: 'SUVs' },
  { id: 'Sedã', label: 'Sedãs' },
  { id: 'Picape', label: 'Picapes' },
  { id: 'Hatch', label: 'Hatches' },
];

const COLORS = [
  { name: 'Branco', hex: '#FFFFFF', border: true },
  { name: 'Preto', hex: '#000000' },
  { name: 'Prata', hex: '#C0C0C0' },
  { name: 'Cinza', hex: '#808080' },
  { name: 'Vermelho', hex: '#EF4444' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Verde', hex: '#22C55E' },
  { name: 'Amarelo', hex: '#EAB308' },
  { name: 'Outra', hex: 'transparent', icon: true }
];

const FUEL_OPTIONS = ['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido'];

// Gera anos de 2026 até 1950
const YEARS = Array.from({ length: 2026 - 1950 + 1 }, (_, i) => 2026 - i);

export const VehiclesList: React.FC<VehiclesListProps> = ({ ads, onBack, onAdClick, favorites, onToggleFavorite, filterContext, onClearFilter, promotions = [], onNavigate }) => {
  const [selectedGroup, setSelectedGroup] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecentFilterActive, setIsRecentFilterActive] = useState(false);

  // Filter Modal State
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // FIPE API Data States
  const [fipeBrands, setFipeBrands] = useState<FipeItem[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeItem[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Filter Values
  const [filters, setFilters] = useState({
    brand: '',
    baseModel: '', // Primeiro nome (Ex: Onix)
    version: '',   // Nome completo (Ex: Onix Hatch LT 1.0)
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    maxMileage: '',
    transmission: '',
    fuel: '',
    color: ''
  });


  // Load Brands on Mount
  useEffect(() => {
    const loadBrands = async () => {
      setIsLoadingBrands(true);
      const brands = await fipeApi.getBrands();
      setFipeBrands(brands);
      setIsLoadingBrands(false);
    };
    loadBrands();
  }, []);

  // Handle Filter Context
  useEffect(() => {
    if (filterContext?.mode === 'recent') {
      setIsRecentFilterActive(true);
      // Reset other filters just in case
      setSelectedGroup('todos');
      if (onClearFilter) onClearFilter();
    }
  }, [filterContext]);


  // Handle Brand Change & Load Models
  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandName = e.target.value;

    setFilters(prev => ({ ...prev, brand: brandName, baseModel: '', version: '' }));
    setFipeModels([]); // Reset models

    if (brandName) {
      const selectedBrandObj = fipeBrands.find(b => b.nome === brandName);
      if (selectedBrandObj) {
        setIsLoadingModels(true);
        const models = await fipeApi.getModels(selectedBrandObj.codigo);
        setFipeModels(models);
        setIsLoadingModels(false);
      }
    }
  };

  // --- DERIVED LISTS FOR DROPDOWNS ---

  // Extrai lista única de primeiros nomes dos modelos (Ex: [Argo, Cronos, Palio...])
  const uniqueBaseModels = useMemo(() => {
    if (fipeModels.length === 0) return [];
    const baseNames = fipeModels.map(m => m.nome.split(' ')[0]);
    return Array.from(new Set(baseNames)).sort();
  }, [fipeModels]);

  // Filtra as versões baseadas no modelo base selecionado
  const availableVersions = useMemo(() => {
    if (!filters.baseModel) return [];
    return fipeModels.filter(m => m.nome.split(' ')[0] === filters.baseModel);
  }, [fipeModels, filters.baseModel]);

  // ------------------------------------

  // --- MASKING HELPERS ---

  const handlePriceChange = (value: string, field: 'minPrice' | 'maxPrice') => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      setFilters(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const numberValue = Number(cleanValue) / 100;
    const formatted = numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    setFilters(prev => ({ ...prev, [field]: formatted }));
  };

  const handleMileageChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      setFilters(prev => ({ ...prev, maxMileage: '' }));
      return;
    }
    const numberValue = Number(cleanValue);
    const formatted = numberValue.toLocaleString('pt-BR');
    setFilters(prev => ({ ...prev, maxMileage: formatted }));
  };

  const parseFormattedNumber = (value: string) => {
    if (!value) return 0;
    return Number(value.replace(/\./g, '').replace(',', '.'));
  };

  // -----------------------

  const searchSuggestions = searchTerm.length >= 2
    ? ads.filter(ad =>
      ad.category === 'autos' &&
      ad.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6)
    : [];

  const filteredAds = useMemo(() => {
    // 1. Filtragem Inicial
    const filtered = ads.filter(ad => {
      // Filter Recent Logic
      if (isRecentFilterActive) {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const adDate = ad.createdAt ? new Date(ad.createdAt) : new Date(ad.date || '');
        if (isNaN(adDate.getTime()) || adDate < fortyEightHoursAgo) return false;
      }

      // Status (Relaxed for mocks)
      if (ad.status !== AdStatus.ACTIVE) return false;

      // Grupo
      if (selectedGroup !== 'todos') {
        if (!ad.vehicleType?.includes(selectedGroup)) return false;
      }

      // Busca Texto
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesTitle = ad.title.toLowerCase().includes(lowerSearch);
        const matchesLocation = ad.location.toLowerCase().includes(lowerSearch);
        if (!matchesTitle && !matchesLocation) return false;
      }

      // Filtros Avançados
      if (filters.brand) {
        const cleanFilterBrand = filters.brand.toLowerCase();
        const brandParts = cleanFilterBrand.split(/[\s-]+/).filter(p => p.length > 1);
        const adText = ((ad.vehicleType || '') + ' ' + ad.title + ' ' + (ad.description || '')).toLowerCase();

        const matchesBrand = brandParts.length > 0
          ? brandParts.some(part => adText.includes(part))
          : adText.includes(cleanFilterBrand);

        if (!matchesBrand) return false;
      }

      if (filters.baseModel) {
        const cleanBase = filters.baseModel.toLowerCase();
        const adText = ((ad.vehicleType || '') + ' ' + ad.title).toLowerCase();
        if (!adText.includes(cleanBase)) return false;
      }

      if (filters.version) {
        const cleanVersion = filters.version.toLowerCase();
        const adText = ((ad.vehicleType || '') + ' ' + ad.title).toLowerCase();
        const versionParts = cleanVersion.split(' ').filter(p => p.length > 2 && p.toLowerCase() !== filters.baseModel.toLowerCase());

        if (versionParts.length > 0) {
          const matchesVersion = versionParts.some(part => adText.includes(part));
          if (!matchesVersion) return false;
        }
      }

      const adPrice = ad.price;
      const filterMinPrice = parseFormattedNumber(filters.minPrice);
      const filterMaxPrice = parseFormattedNumber(filters.maxPrice);
      if (filterMinPrice > 0 && adPrice < filterMinPrice) return false;
      if (filterMaxPrice > 0 && adPrice > filterMaxPrice) return false;

      if (filters.minYear && (ad.year || 0) < Number(filters.minYear)) return false;
      if (filters.maxYear && (ad.year || 0) > Number(filters.maxYear)) return false;

      const filterMaxMileage = parseFormattedNumber(filters.maxMileage);
      if (filterMaxMileage > 0 && (ad.mileage || 0) > filterMaxMileage) return false;

      if (filters.transmission && ad.gearbox !== filters.transmission) return false;
      if (filters.fuel && ad.fuel !== filters.fuel) return false;
      if (filters.color && ad.color !== filters.color) return false;

      return true;
    });

    // 2. Ordenação (Destaques Primeiro)
    // Prioridade: Premium (4) > Advanced (3) > Basic (2) > Featured (1) > Normal (0)
    return filtered.sort((a, b) => {
      const getPriority = (item: AdItem) => {
        if (item.boostPlan === 'premium') return 4;
        if (item.boostPlan === 'advanced') return 3;
        if (item.boostPlan === 'basic') return 2;
        if (item.isFeatured) return 1;
        return 0;
      };

      const weightA = getPriority(a);
      const weightB = getPriority(b);

      return weightB - weightA;
    });

  }, [ads, selectedGroup, searchTerm, filters]);

  // Filters that are counted for the badge (excluding Brand/Model since they are visible)
  const activeFiltersCount = [
    filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear,
    filters.maxMileage, filters.transmission, filters.fuel, filters.color
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      brand: '', baseModel: '', version: '',
      minPrice: '', maxPrice: '', minYear: '', maxYear: '',
      maxMileage: '', transmission: '', fuel: '', color: ''
    });
    setFipeModels([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header
        title="Veículos"
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

      {/* Search Bar */}
      <div className="px-4 mb-3 relative z-40">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>

        {/* Sugestões */}
        {searchTerm.length >= 2 && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            {searchSuggestions.map((ad, index) => (
              <button
                key={ad.id}
                onClick={() => onAdClick(ad)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${index !== searchSuggestions.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
              >
                <img src={ad.image} alt={ad.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{ad.title}</p>
                  <p className="text-xs text-primary font-medium">
                    {ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </div>


      {/* IN-LINE QUICK FILTERS (Brand & Model) */}
      <div className="px-4 mb-4 space-y-3 relative z-30 animate-in slide-in-from-top-2">
        {/* ... filters content ... */}
        <div className="grid grid-cols-2 gap-3">
          {/* Brand Select */}
          <div className="relative">
            <select
              value={filters.brand}
              onChange={handleBrandChange}
              disabled={isLoadingBrands}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium appearance-none truncate pr-8 text-sm shadow-sm disabled:opacity-50"
            >
              <option value="">Marca</option>
              {fipeBrands.map(b => (
                <option key={b.codigo} value={b.nome}>{b.nome}</option>
              ))}
            </select>
            {isLoadingBrands ? (
              <div className="absolute right-3 top-3.5"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
            ) : (
              <div className="absolute right-3 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
            )}
          </div>

          {/* Model Select */}
          <div className="relative">
            <select
              value={filters.baseModel}
              onChange={(e) => setFilters(prev => ({ ...prev, baseModel: e.target.value, version: '' }))}
              disabled={!filters.brand || uniqueBaseModels.length === 0}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium appearance-none truncate pr-8 text-sm shadow-sm disabled:opacity-50"
            >
              <option value="">Modelo</option>
              {uniqueBaseModels.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {isLoadingModels ? (
              <div className="absolute right-3 top-3.5"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
            ) : (
              <div className="absolute right-3 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
            )}
          </div>
        </div>

        {/* Version Select (Conditionally displayed) */}
        {filters.baseModel && (
          <div className="relative animate-in fade-in">
            <select
              value={filters.version}
              onChange={(e) => setFilters(prev => ({ ...prev, version: e.target.value }))}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium appearance-none truncate pr-8 text-sm shadow-sm"
            >
              <option value="">Todas as versões</option>
              {availableVersions.map(m => (
                <option key={m.codigo} value={m.nome}>{m.nome}</option>
              ))}
            </select>
            <div className="absolute right-3 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
          </div>
        )}
      </div>

      {/* Promotional Carousel */}
      <div className="mb-3">
        <PromoCarousel
          banners={useMemo(() => {
            const isPromotionVisible = (promo: VehiclesPromotion): boolean => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const start = new Date(promo.startDate);
              start.setHours(0, 0, 0, 0);
              const end = new Date(promo.endDate);
              end.setHours(23, 59, 59, 999);
              return promo.active && today >= start && today <= end;
            };

            const visiblePromotions = promotions
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

            return visiblePromotions.length > 0 ? visiblePromotions : VEHICLES_PROMO_BANNERS;
          }, [promotions])}
          onPromoClick={(promo) => {
            if (promo.link && promo.link !== '#') {
              window.open(promo.link, '_blank');
            }
          }}
        />
      </div>

      {/* Groups / Categories */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar mb-2 relative z-0">
        {VEHICLE_GROUPS.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroup(group.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedGroup === group.id
              ? 'bg-primary text-white shadow-md shadow-blue-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Ads List */}
      <div className="px-4 flex flex-col gap-4 relative z-0">
        {filteredAds.length > 0 ? (
          filteredAds.map((ad) => {
            const isFav = favorites.some(f => f.id === ad.id);

            // Visual Styles for Boosted Ads
            let borderClass = 'border-gray-100';
            let badge = null;

            if (ad.boostPlan === 'premium') {
              borderClass = 'border-yellow-400 ring-1 ring-yellow-400/30';
              badge = (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-20">
                  <Zap className="w-3 h-3 fill-current" /> Turbo Máx
                </div>
              );
            } else if (ad.boostPlan === 'advanced') {
              borderClass = 'border-cyan-400';
              badge = (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-20">
                  <Trophy className="w-3 h-3 fill-current" /> Turbo Ágil
                </div>
              );
            } else if (ad.boostPlan === 'basic' || ad.isFeatured) {
              badge = (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-gray-500 to-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-20">
                  <Star className="w-3 h-3 fill-current" /> Destaque
                </div>
              );
            }

            return (
              <div
                key={ad.id}
                onClick={() => onAdClick(ad)}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden cursor-pointer active:scale-[0.99] transition-all group ${borderClass}`}
              >
                <div className="relative h-48 w-full">
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />

                  {/* Badge de Destaque (Se houver) */}
                  {badge}

                  <div className="absolute top-3 right-3 flex gap-2 z-30">
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
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-lg">
                    {ad.year} • {ad.mileage}km
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{ad.title}</h3>
                  </div>
                  <PriceTag value={ad.price} />
                  <div className="mt-3 flex items-center gap-1 text-gray-400 text-xs font-medium">
                    <Car className="w-3.5 h-3.5" />
                    <span>{ad.location}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Car className="w-12 h-12 mb-2 text-gray-300" />
            <p>Nenhum veículo encontrado.</p>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="mt-4 text-primary font-bold text-sm underline">
                Limpar Filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* FILTER MODAL (Bottom Sheet) - Reduced Content */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsFilterOpen(false)} />

          <div className="bg-white w-full max-w-md rounded-t-[30px] shadow-2xl relative animate-slide-in-from-bottom flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 pt-4 pb-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-[30px]">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Filtros Avançados</h2>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
                )}
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-8 overflow-y-auto pb-28">

              {/* ... existing filter content ... */}
              {/* Preço */}
              <section>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <DollarSign className="w-4 h-4 text-primary" /> Faixa de Preço (R$)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400 text-sm">Min</span>
                    <input
                      type="text" inputMode="numeric" placeholder="0,00"
                      value={filters.minPrice}
                      onChange={(e) => handlePriceChange(e.target.value, 'minPrice')}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400 text-sm">Max</span>
                    <input
                      type="text" inputMode="numeric" placeholder="Sem limite"
                      value={filters.maxPrice}
                      onChange={(e) => handlePriceChange(e.target.value, 'maxPrice')}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </section>

              {/* Ano */}
              <section>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 text-primary" /> Ano do Modelo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={filters.minYear}
                    onChange={(e) => setFilters(p => ({ ...p, minYear: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary focus:bg-white appearance-none"
                  >
                    <option value="">De (Todos)</option>
                    {YEARS.map(year => <option key={`min-${year}`} value={year}>{year}</option>)}
                  </select>

                  <select
                    value={filters.maxYear}
                    onChange={(e) => setFilters(p => ({ ...p, maxYear: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary focus:bg-white appearance-none"
                  >
                    <option value="">Até (Todos)</option>
                    {YEARS.map(year => <option key={`max-${year}`} value={year}>{year}</option>)}
                  </select>
                </div>
              </section>

              {/* Quilometragem */}
              <section>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Gauge className="w-4 h-4 text-primary" /> KM Máxima
                </label>
                <input
                  type="text" inputMode="numeric" placeholder="Ex: 80.000"
                  value={filters.maxMileage}
                  onChange={(e) => handleMileageChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
                />
              </section>

              {/* Combustível */}
              <section>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Fuel className="w-4 h-4 text-primary" /> Combustível
                </label>
                <div className="flex flex-wrap gap-2">
                  {FUEL_OPTIONS.map(type => {
                    const isSelected = filters.fuel === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setFilters(p => ({ ...p, fuel: isSelected ? '' : type }))}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-95 flex items-center gap-2 ${isSelected
                          ? 'bg-blue-50 border-primary text-primary shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {type === 'Elétrico' && <Zap className="w-3 h-3" />}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Câmbio */}
              <section>
                <label className="text-sm font-bold text-gray-700 mb-3 block">Câmbio</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {['Automático', 'Manual'].map(type => {
                    const isSelected = filters.transmission === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setFilters(p => ({ ...p, transmission: isSelected ? '' : type }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isSelected
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Cor */}
              <section>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Palette className="w-4 h-4 text-primary" /> Cor
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COLORS.map(color => {
                    const isSelected = filters.color === color.name;
                    return (
                      <button
                        key={color.name}
                        onClick={() => setFilters(p => ({ ...p, color: isSelected ? '' : color.name }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${isSelected
                          ? 'bg-blue-50 border-primary text-primary shadow-sm ring-1 ring-primary/20'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {!color.icon ? (
                          <div
                            className={`w-3 h-3 rounded-full ${color.border ? 'border border-gray-300' : ''}`}
                            style={{ backgroundColor: color.hex }}
                          />
                        ) : (
                          <Palette className="w-3 h-3 text-gray-400" />
                        )}
                        <span className="truncate">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Footer Actions (Fixed) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 rounded-b-[30px] flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <button
                onClick={clearFilters}
                className="px-6 py-4 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
              >
                Limpar
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                Ver {filteredAds.length} resultados
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />

    </div>
  );
};
