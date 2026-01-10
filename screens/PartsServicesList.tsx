
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, Heart, Wrench, Sparkles, Speaker, ChevronRight, X, DollarSign, MapPin, Package, Check, Car } from 'lucide-react';
import { Header, PriceTag } from '../components/Shared';
import { AdItem, FilterContext, AdStatus, PartsServicesPromotion } from '../types';
import { PARTS_SERVICES_PROMO_BANNERS } from '../constants';
import { PromoCarousel } from '../components/HomeSections/PromoCarousel';
import { Footer } from '../components/Footer';

interface PartsServicesListProps {
  ads: AdItem[];
  onBack: () => void;
  onAdClick: (ad: AdItem) => void;
  favorites: AdItem[];
  onToggleFavorite: (ad: AdItem) => void;
  filterContext?: FilterContext | null;
  onClearFilter?: () => void;
  promotions?: PartsServicesPromotion[];
}

const SERVICE_GROUPS = [
  { id: 'Serviços', label: 'Serviços Gerais' },
  { id: 'Estética', label: 'Estética Automotiva' },
  { id: 'Som', label: 'Som e Vídeo' },
  { id: 'Manutenção', label: 'Manutenção' },
  { id: 'Lavagem', label: 'Lavagem' },
  { id: 'Peças', label: 'Peças Mecânicas' }, // Adicionado para cobrir peças gerais
];

const CONDITIONS = ['Novo', 'Usado'];

export const PartsServicesList: React.FC<PartsServicesListProps> = ({ ads, onBack, onAdClick, favorites, onToggleFavorite, filterContext, onClearFilter, promotions = [] }) => {
  const [selectedGroup, setSelectedGroup] = useState('todos'); // Tabs do topo
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filtros Avançados
  const [filters, setFilters] = useState({
    vehicleCompatible: '', // New: Veículo compatível (Marca/Modelo)
    location: '',
    minPrice: '',
    maxPrice: '',
    conditions: [] as string[],
    categories: [] as string[] // Categorias selecionadas no Modal
  });



  // Handle Filter Context
  useEffect(() => {
    if (filterContext?.mode === 'category') {
      if (filterContext.partTypes && filterContext.partTypes.length > 0) {
        setFilters(prev => ({ ...prev, categories: filterContext.partTypes || [] }));
      }
      if (onClearFilter) onClearFilter();
    }
  }, [filterContext]);

  // --- HELPERS ---
  const toggleFilterArray = (field: 'conditions' | 'categories', value: string) => {
    setFilters(prev => {
      const list = prev[field];
      if (list.includes(value)) {
        return { ...prev, [field]: list.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...list, value] };
      }
    });
  };

  const handlePriceChange = (value: string, field: 'minPrice' | 'maxPrice') => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      setFilters(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const numberValue = Number(cleanValue) / 100;
    const formatted = numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setFilters(prev => ({ ...prev, [field]: formatted }));
  };

  const parseFormattedNumber = (value: string) => {
    if (!value) return 0;
    return Number(value.replace(/\./g, '').replace(',', '.'));
  };

  // --- FILTRAGEM ---
  const searchSuggestions = searchTerm.length >= 2
    ? ads.filter(ad =>
      (ad.category === 'pecas' || ad.category === 'servicos') &&
      ad.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6)
    : [];

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      // Status (Relaxed)
      if (ad.status !== AdStatus.ACTIVE) return false;

      // 2. Busca Texto
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchTitle = ad.title.toLowerCase().includes(lowerSearch);
        const matchLoc = ad.location.toLowerCase().includes(lowerSearch);
        if (!matchTitle && !matchLoc) return false;
      }

      // 3. Tab do Topo (Se selecionado algo diferente de Todos)
      if (selectedGroup !== 'todos') {
        if (!ad.partType?.includes(selectedGroup) && !ad.title.includes(selectedGroup)) return false;
      }

      // 4. Filtros do Modal

      // Veículo Compatível - Busca no título ou descrição (Simulação)
      if (filters.vehicleCompatible) {
        const search = filters.vehicleCompatible.toLowerCase();
        // Assume que a compatibilidade pode estar no título ou descrição
        const inTitle = ad.title.toLowerCase().includes(search);
        const inDesc = ad.description ? ad.description.toLowerCase().includes(search) : false;
        if (!inTitle && !inDesc) return false;
      }

      // Localização
      if (filters.location) {
        if (!ad.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }

      // Preço
      const price = ad.price;
      const minP = parseFormattedNumber(filters.minPrice);
      const maxP = parseFormattedNumber(filters.maxPrice);
      if (minP > 0 && price < minP) return false;
      if (maxP > 0 && price > maxP) return false;

      // Condição (Novo/Usado)
      if (filters.conditions.length > 0) {
        if (!ad.condition || !filters.conditions.includes(ad.condition)) return false;
      }

      // Categorias (Modal - sobrepõe/complementa a tab do topo se usado)
      if (filters.categories.length > 0) {
        // Verifica se o partType do anuncio contem alguma das strings selecionadas
        const matchesCategory = filters.categories.some(cat => ad.partType?.includes(cat));
        if (!matchesCategory) return false;
      }

      return true;
    });
  }, [ads, selectedGroup, searchTerm, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.vehicleCompatible) count++;
    if (filters.location) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    count += filters.conditions.length;
    count += filters.categories.length;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      vehicleCompatible: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      conditions: [],
      categories: []
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header
        title="Peças e Serviços"
        onBack={onBack}
        rightElement={
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${activeFiltersCount > 0
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'
              }`}
          >
            <span className="text-sm font-bold">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white text-purple-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-purple-100">
                {activeFiltersCount}
              </span>
            )}
          </button>
        }
      />

      {/* Search Bar */}
      <div className="px-4 mb-4 relative z-40">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar peça ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm"
          />
        </div>

        {/* Dropdown de Sugestões */}
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
                  <p className="text-xs text-purple-600 font-medium">
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
        <PromoCarousel
          banners={useMemo(() => {
            const isPromotionVisible = (promo: PartsServicesPromotion): boolean => {
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

            return visiblePromotions.length > 0 ? visiblePromotions : PARTS_SERVICES_PROMO_BANNERS;
          }, [promotions])}
          onPromoClick={(promo) => {
            if (promo.link && promo.link !== '#') {
              window.open(promo.link, '_blank');
            }
          }}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar mb-2 relative z-0">
        <button
          onClick={() => setSelectedGroup('todos')}
          className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedGroup === 'todos'
            ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          Todos
        </button>
        {SERVICE_GROUPS.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroup(group.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedGroup === group.id
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="px-4 flex flex-col gap-4 relative z-0">
        {filteredAds.length > 0 ? (
          filteredAds.map((ad) => {
            const isFav = favorites.some(f => f.id === ad.id);
            return (
              <div
                key={ad.id}
                onClick={() => onAdClick(ad)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition-all flex h-32"
              >
                <div className="w-32 h-full relative flex-shrink-0">
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
                    {ad.partType?.split(' ')[0] || 'Item'}
                  </div>
                </div>

                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">{ad.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(ad);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ad.location}</p>
                  </div>

                  <div className="flex justify-between items-end">
                    <PriceTag value={ad.price} />
                    {ad.condition && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                        {ad.condition}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Wrench className="w-12 h-12 mb-2 text-gray-300" />
            <p>Nenhum serviço ou peça encontrada.</p>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="mt-4 text-purple-600 font-bold text-sm underline">
                Limpar Filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- FILTER MODAL --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsFilterOpen(false)} />

          <div className="bg-white w-full max-w-md h-[85vh] rounded-t-[30px] shadow-2xl relative animate-slide-in-from-bottom flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <button onClick={() => setIsFilterOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6 text-gray-800" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">Filtrar</h2>
              <button onClick={clearFilters} className="text-purple-600 text-sm font-bold hover:opacity-80">
                Limpar
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
              {/* ... existing content ... */}
              {/* 1. Veículo Compatível (NEW) */}
              <section>
                <label className="text-sm font-bold text-gray-900 mb-3 block flex items-center gap-2">
                  <Car className="w-4 h-4 text-purple-600" /> Veículo Compatível
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: Gol G5, Honda Civic..."
                    value={filters.vehicleCompatible}
                    onChange={(e) => setFilters(prev => ({ ...prev, vehicleCompatible: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              </section>

              {/* 2. Categorias (Multi-select) */}
              <section>
                <label className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide block">CATEGORIAS</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_GROUPS.map(group => {
                    const isSelected = filters.categories.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        onClick={() => toggleFilterArray('categories', group.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${isSelected
                          ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                          : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                          }`}
                      >
                        {group.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* 3. Preço */}
              <section>
                <label className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide block">FAIXA DE PREÇO</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400 text-sm">Min</span>
                    <input
                      type="text" inputMode="numeric" placeholder="0,00"
                      value={filters.minPrice}
                      onChange={(e) => handlePriceChange(e.target.value, 'minPrice')}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400 text-sm">Max</span>
                    <input
                      type="text" inputMode="numeric" placeholder="Sem limite"
                      value={filters.maxPrice}
                      onChange={(e) => handlePriceChange(e.target.value, 'maxPrice')}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                </div>
              </section>

              {/* 4. Localização */}
              <section>
                <label className="text-sm font-bold text-gray-900 mb-3 block">Localização</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Busque por cidade ou bairro"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-800 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              </section>

              {/* 5. Condição */}
              <section>
                <label className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide block">CONDIÇÃO</label>
                <div className="grid grid-cols-2 gap-3">
                  {CONDITIONS.map(cond => {
                    const isSelected = filters.conditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        onClick={() => toggleFilterArray('conditions', cond)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${isSelected
                          ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                          : 'bg-white border-gray-200 text-gray-600'
                          }`}
                      >
                        <Package className="w-4 h-4" />
                        {cond}
                        {isSelected && <Check className="w-4 h-4 ml-1" />}
                      </button>
                    )
                  })}
                </div>
              </section>

            </div>

            {/* Footer Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-purple-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Aplicar Filtros
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-lg">{filteredAds.length}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />

    </div>
  );
};
