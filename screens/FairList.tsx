
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, MapPin, Heart, Clock, AlertCircle, Map, Filter, X, Loader2, Car, ChevronDown } from 'lucide-react';
import { PriceTag } from '../components/Shared';
import { AdItem } from '../types';
import { fipeApi, FipeItem } from '../services/fipeApi';

interface FairListProps {
  ads: AdItem[];
  onBack: () => void;
  onAdClick: (ad: AdItem) => void;
  favorites: AdItem[];
  onToggleFavorite: (ad: AdItem) => void;
}

// Helper para calcular tempo restante
const getTimeLeft = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  if (diff <= 0) return 'Expirado';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const FairList: React.FC<FairListProps> = ({ 
  ads, 
  onBack, 
  onAdClick, 
  favorites, 
  onToggleFavorite 
}) => {
  
  // --- FILTER STATES ---
  const [filters, setFilters] = useState({
    brand: '',
    baseModel: '',
    version: ''
  });

  // --- FIPE DATA STATES ---
  const [fipeBrands, setFipeBrands] = useState<FipeItem[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeItem[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

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

  // Handle Brand Change
  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandName = e.target.value;
    setFilters(prev => ({ ...prev, brand: brandName, baseModel: '', version: '' }));
    setFipeModels([]);

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

  // --- DERIVED LISTS ---
  const uniqueBaseModels = useMemo(() => {
    if (fipeModels.length === 0) return [];
    const baseNames = fipeModels.map(m => m.nome.split(' ')[0]);
    return Array.from(new Set(baseNames)).sort();
  }, [fipeModels]);

  const availableVersions = useMemo(() => {
    if (!filters.baseModel) return [];
    return fipeModels.filter(m => m.nome.split(' ')[0] === filters.baseModel);
  }, [fipeModels, filters.baseModel]);

  // --- FILTERING LOGIC ---
  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const adTitle = (ad.title + ' ' + (ad.vehicleType || '')).toLowerCase();

      // Brand Filter
      if (filters.brand) {
        if (!adTitle.includes(filters.brand.toLowerCase())) return false;
      }

      // Base Model Filter
      if (filters.baseModel) {
        if (!adTitle.includes(filters.baseModel.toLowerCase())) return false;
      }

      // Version Filter (Flexible Check)
      if (filters.version) {
        const cleanVersion = filters.version.toLowerCase();
        const uniqueVersionParts = cleanVersion
          .replace(filters.brand.toLowerCase(), '')
          .replace(filters.baseModel.toLowerCase(), '')
          .trim()
          .split(' ')
          .filter(p => p.length > 1);
        
        if (uniqueVersionParts.length > 0) {
           const matches = uniqueVersionParts.some(part => adTitle.includes(part));
           if (!matches) return false;
        }
      }

      return true;
    });
  }, [ads, filters]);

  const activeFiltersCount = [filters.brand, filters.baseModel, filters.version].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ brand: '', baseModel: '', version: '' });
    setFipeModels([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">
      
      {/* Custom Header for Fair */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 pt-4 pb-20 rounded-b-[40px] shadow-xl relative overflow-hidden z-10">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        <div className="relative z-20 flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white"></div>
            <span className="text-xs font-bold text-white">Ao Vivo</span>
          </div>
        </div>

        <div className="relative z-20 px-2 text-center">
           <div className="inline-flex justify-center items-center bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm border border-white/10 shadow-lg">
              <Map className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-3xl font-bold text-white mb-1 leading-tight">Estou na Feira Agora</h1>
           <p className="text-green-100 text-sm max-w-xs mx-auto font-medium">
             Veículos disponíveis para visitação presencial.
           </p>
        </div>
      </div>

      {/* --- INLINE FILTERS CARD --- */}
      <div className="px-4 -mt-12 relative z-30 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
           <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                 <Filter className="w-4 h-4 text-green-600" /> Filtrar Veículos
              </h3>
              {activeFiltersCount > 0 && (
                 <button onClick={clearFilters} className="text-xs text-red-500 font-bold hover:underline">
                    Limpar
                 </button>
              )}
           </div>
           
           <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Brand Select */}
              <div className="relative">
                 <select 
                   value={filters.brand} 
                   onChange={handleBrandChange}
                   disabled={isLoadingBrands}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:bg-white transition-all appearance-none"
                 >
                    <option value="">Marca</option>
                    {fipeBrands.map(b => <option key={b.codigo} value={b.nome}>{b.nome}</option>)}
                 </select>
                 {isLoadingBrands ? (
                    <div className="absolute right-3 top-3"><Loader2 className="w-4 h-4 text-green-600 animate-spin"/></div>
                 ) : (
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                 )}
              </div>

              {/* Model Select */}
              <div className="relative">
                 <select 
                   value={filters.baseModel} 
                   onChange={(e) => setFilters(prev => ({...prev, baseModel: e.target.value, version: ''}))}
                   disabled={!filters.brand || uniqueBaseModels.length === 0}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:bg-white transition-all appearance-none disabled:opacity-50"
                 >
                    <option value="">Modelo</option>
                    {uniqueBaseModels.map(name => <option key={name} value={name}>{name}</option>)}
                 </select>
                 {isLoadingModels ? (
                    <div className="absolute right-3 top-3"><Loader2 className="w-4 h-4 text-green-600 animate-spin"/></div>
                 ) : (
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                 )}
              </div>
           </div>

           {/* Version Select (Dynamic) */}
           {filters.baseModel && (
              <div className="relative animate-in fade-in slide-in-from-top-1">
                 <select 
                   value={filters.version} 
                   onChange={(e) => setFilters(prev => ({...prev, version: e.target.value}))}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:bg-white transition-all appearance-none"
                 >
                    <option value="">Todas as versões</option>
                    {availableVersions.map(m => <option key={m.codigo} value={m.nome}>{m.nome}</option>)}
                 </select>
                 <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
           )}
        </div>
      </div>

      <div className="px-4 relative z-20 flex flex-col gap-4">
        {filteredAds.length > 0 ? (
          filteredAds.map((ad) => {
            const isFav = favorites.some(f => f.id === ad.id);
            const timeLeft = ad.fairPresence ? getTimeLeft(ad.fairPresence.expiresAt) : '';

            return (
              <div 
                key={ad.id} 
                onClick={() => onAdClick(ad)}
                className="bg-white rounded-2xl shadow-md border-2 border-green-400 overflow-hidden cursor-pointer active:scale-[0.98] transition-all group relative ring-2 ring-green-50"
              >
                {/* Live Badge */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
                   <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                     <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                     NA FEIRA
                   </div>
                </div>

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

                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
                  
                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
                     <div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1 text-shadow-sm">{ad.title}</h3>
                        <p className="text-xs opacity-90">{ad.vehicleType}</p>
                     </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                     <PriceTag value={ad.price} />
                     <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-bold">Expira em: {timeLeft}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium border-t border-gray-100 pt-3">
                    <MapPin className="w-3.5 h-3.5 text-green-600" />
                    <span>Disponível para ver agora em: <strong className="text-gray-800">{ad.location}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               {activeFiltersCount > 0 ? <Filter className="w-10 h-10 text-gray-300" /> : <AlertCircle className="w-10 h-10 text-gray-300" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhum veículo encontrado</h3>
            <p className="text-gray-500 text-sm">
              {activeFiltersCount > 0 
                ? 'Tente ajustar seus filtros para encontrar o que procura.' 
                : 'Seja o primeiro a marcar sua presença e apareça aqui!'}
            </p>
            {activeFiltersCount > 0 && (
               <button onClick={clearFilters} className="mt-4 text-green-600 font-bold text-sm underline">
                 Limpar Filtros
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
