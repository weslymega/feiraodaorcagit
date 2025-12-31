
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, Heart, MapPin, Key, ChevronRight, X, Check, DollarSign, Ruler, ArrowRight, Home, Building, Trees, Briefcase } from 'lucide-react';
import { Header, PriceTag } from '../components/Shared';
import { AdItem, BannerItem } from '../types';

interface RealEstateListProps {
  ads: AdItem[];
  banners: BannerItem[]; // New prop
  onBack: () => void;
  onAdClick: (ad: AdItem) => void;
  favorites: AdItem[];
  onToggleFavorite: (ad: AdItem) => void;
}

const PROPERTY_TYPES = ['Casa', 'Apartamento', 'Terreno', 'Comercial'];
const AMENITIES_OPTIONS = [
  'Garagem', 'Piscina', 'Churrasqueira', 'Varanda', 
  'Academia', 'Ar Condicionado', 'Elevador', 'Portaria 24h'
];

const PROPERTY_QUICK_FILTERS = [
  { id: 'todos', label: 'Todos', icon: null },
  { id: 'Casa', label: 'Casas', icon: <Home className="w-3 h-3" /> },
  { id: 'Apartamento', label: 'Apartamentos', icon: <Building className="w-3 h-3" /> },
  { id: 'Terreno', label: 'Terrenos', icon: <Trees className="w-3 h-3" /> },
  { id: 'Comercial', label: 'Comercial', icon: <Briefcase className="w-3 h-3" /> },
];

export const RealEstateList: React.FC<RealEstateListProps> = ({ ads, banners, onBack, onAdClick, favorites, onToggleFavorite }) => {
  const [transactionType, setTransactionType] = useState<'sale' | 'rent'>('sale');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedPropertyType, setSelectedPropertyType] = useState('todos');

  // Filter Modal State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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

  // Filter Active Banners
  const activeBanners = useMemo(() => {
      return banners.filter(b => b.active && new Date(b.expiresAt) > new Date());
  }, [banners]);

  // Banner Rotation Logic
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [activeBanners.length]);

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
    return ads.filter(ad => {
      // 1. Basic Category & Transaction
      if (ad.category !== 'imoveis') return false;
      if ((ad.transactionType || 'sale') !== transactionType) return false;

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
  }, [ads, transactionType, searchTerm, filters, selectedPropertyType]);

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
            onClick={() => onChange(isSelected ? null : num)}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
              isSelected 
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        title="Imóveis" 
        onBack={onBack}
        rightElement={
          <button 
            onClick={() => setIsFilterOpen(true)}
            className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
              activeFiltersCount > 0 
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

      {/* Transaction Type Toggle */}
      <div className="bg-white px-4 pt-2 pb-4 shadow-sm border-b border-gray-100 relative z-10">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setTransactionType('sale')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              transactionType === 'sale' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
            }`}
          >
            Comprar
          </button>
          <button
            onClick={() => setTransactionType('rent')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              transactionType === 'rent' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Alugar
          </button>
        </div>
      </div>

      {/* Search & Results Header */}
      <div className="px-4 py-4">
         <div className="relative mb-2">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder={`Buscar em ${transactionType === 'sale' ? 'Comprar' : 'Alugar'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
         </div>
      </div>

      {/* PROMOTIONAL BANNER SECTION */}
      {activeBanners.length > 0 && (
        <div className="px-4 mb-4 relative z-30">
          <div className="h-32 rounded-2xl relative overflow-hidden shadow-sm border border-gray-100">
            <div 
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
            >
              {activeBanners.map((banner) => {
                const isFullImage = banner.gradient === 'none';
                return (
                  <div 
                    key={banner.id} 
                    className={`min-w-full h-full ${isFullImage ? 'bg-gray-200' : `bg-gradient-to-r ${banner.gradient}`} relative flex items-center`}
                  >
                    {!isFullImage && (
                      <div className="relative z-10 w-2/3 pl-5 pr-2 py-3 text-white flex flex-col justify-center h-full">
                        <span className="inline-block bg-white/20 backdrop-blur-sm text-[9px] font-bold px-2 py-0.5 rounded w-fit mb-1 border border-white/10">
                          {banner.category}
                        </span>
                        <h2 className="text-lg font-bold leading-tight mb-1 line-clamp-2">{banner.title}</h2>
                        <p className="text-[10px] opacity-90 font-medium text-blue-50 line-clamp-1">{banner.subtitle}</p>
                      </div>
                    )}
                    
                    <div className={`absolute right-0 top-0 bottom-0 ${isFullImage ? 'w-full' : 'w-1/2'} h-full`}>
                      <img 
                        src={banner.image} 
                        alt={banner.title} 
                        className={`w-full h-full object-cover ${!isFullImage ? 'opacity-90' : ''}`}
                        style={!isFullImage ? { maskImage: 'linear-gradient(to left, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)' } : {}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Indicators */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
                {activeBanners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentBannerIndex ? 'bg-white w-3' : 'bg-white/40 w-1'
                    }`} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Type Quick Filters (NEW) */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar mb-2 relative z-0">
        {PROPERTY_QUICK_FILTERS.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedPropertyType(group.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedPropertyType === group.id 
                ? 'bg-primary text-white shadow-md shadow-blue-200' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {group.icon}
            {group.label}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="px-4 flex flex-col gap-4">
        <p className="text-sm font-bold text-gray-700 ml-1 mb-0">
            {filteredAds.length} imóveis encontrados
        </p>
        
        {filteredAds.length > 0 ? (
          filteredAds.map((ad) => {
            const isFav = favorites.some(f => f.id === ad.id);
            return (
              <div 
                key={ad.id} 
                onClick={() => onAdClick(ad)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition-all group"
              >
                <div className="relative h-56 w-full">
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
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
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search className="w-12 h-12 mb-2 text-gray-300" />
            <p>Nenhum imóvel encontrado.</p>
            {activeFiltersCount > 0 && (
               <button onClick={clearFilters} className="mt-4 text-primary font-bold text-sm underline">
                 Limpar Filtros
               </button>
            )}
          </div>
        )}
      </div>

      {/* --- FILTER MODAL (FIXED PROPORTIONS) --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsFilterOpen(false)} />
          
          {/* Modal Container - Max Width applied here to fix proportionality */}
          <div className="bg-white w-full max-w-md h-[92vh] rounded-t-[30px] shadow-2xl relative animate-slide-in-from-bottom flex flex-col overflow-hidden">
             
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
                        onChange={(e) => setFilters(prev => ({...prev, location: e.target.value}))}
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
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                              isSelected 
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
                              onChange={(e) => setFilters(p => ({...p, minPrice: formatNumber(e.target.value)}))}
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
                              onChange={(e) => setFilters(p => ({...p, maxPrice: formatNumber(e.target.value)}))}
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
                        onChange={(val) => setFilters(p => ({...p, bedrooms: val}))} 
                      />
                   </div>

                   <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Banheiros</p>
                      <NumericSelector 
                        value={filters.bathrooms} 
                        onChange={(val) => setFilters(p => ({...p, bathrooms: val}))} 
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
                                  onChange={(e) => setFilters(p => ({...p, minArea: formatNumber(e.target.value)}))}
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
                                  onChange={(e) => setFilters(p => ({...p, maxArea: formatNumber(e.target.value)}))}
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
                  Aplicar Filtros
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-lg">{filteredAds.length}</span>
                </button>
             </div>

          </div>
        </div>
      )}

    </div>
  );
};
