import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, BarChart2, Car, Bike, Truck, ChevronRight, 
  Search, RefreshCw, AlertCircle, Fuel, Calendar, CalendarDays, DollarSign, Info
} from 'lucide-react';
import { Screen, FipeVehicleType } from '../types';
import { Brand, Model, Year, FipeDetail } from '../services/fipeApi';
import { FipeExplorerService } from '../services/FipeExplorerService';
import { SmartImage } from '../components/ui/SmartImage';

interface FipeExplorerProps {
  onBack: () => void;
}

const DropdownSkeleton = () => (
  <div className="w-full h-14 bg-gray-100 animate-pulse rounded-2xl mb-4" />
);

export const FipeExplorer: React.FC<FipeExplorerProps> = ({ onBack }) => {
  const [vehicleType, setVehicleType] = useState<FipeVehicleType>('carros');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [detail, setDetail] = useState<FipeDetail | null>(null);

  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load brands on mount or type change
  useEffect(() => {
    loadBrands();
  }, [vehicleType]);

  const loadBrands = async () => {
    setIsLoadingBrands(true);
    setError(null);
    try {
      const data = await FipeExplorerService.getBrands(vehicleType);
      setBrands(data);
      // Reset dependent selections
      setSelectedBrandId('');
      setModels([]);
      setSelectedModelId('');
      setYears([]);
      setSelectedYearId('');
      setDetail(null);
    } catch (err) {
      setError('Falha ao carregar marcas. Tente novamente.');
    } finally {
      setIsLoadingBrands(false);
    }
  };

  const handleBrandChange = async (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedModelId('');
    setYears([]);
    setSelectedYearId('');
    setDetail(null);
    if (!brandId) {
      setModels([]);
      return;
    }

    setIsLoadingModels(true);
    try {
      const data = await FipeExplorerService.getModelsByBrand(vehicleType, brandId);
      setModels(data);
    } catch (err) {
      setError('Falha ao carregar modelos.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleModelChange = async (modelId: string) => {
    setSelectedModelId(modelId);
    setSelectedYearId('');
    setDetail(null);
    if (!modelId) {
      setYears([]);
      return;
    }

    setIsLoadingYears(true);
    try {
      const data = await FipeExplorerService.getYearsByModel(vehicleType, selectedBrandId, modelId);
      setYears(data);
    } catch (err) {
      setError('Falha ao carregar versões.');
    } finally {
      setIsLoadingYears(false);
    }
  };

  const handleYearChange = async (yearId: string) => {
    setSelectedYearId(yearId);
    if (!yearId) {
      setDetail(null);
      return;
    }

    setIsLoadingDetail(true);
    try {
      const data = await FipeExplorerService.getPrice(vehicleType, selectedBrandId, selectedModelId, yearId);
      setDetail(data);
    } catch (err) {
      setError('Falha ao carregar detalhes do preço.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const resetAll = () => {
    setSelectedBrandId('');
    setModels([]);
    setSelectedModelId('');
    setYears([]);
    setSelectedYearId('');
    setDetail(null);
    loadBrands();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col no-scrollbar">
      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-6 shadow-sm sticky top-0 z-[100]">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Explorador FIPE</h1>
          </div>
        </div>
        <p className="text-xs text-gray-500 font-medium ml-1">Consulte preços oficiais de todo o mercado nacional</p>
      </div>

      <div className="flex-1 px-5 pt-6 pb-32 overflow-y-auto no-scrollbar">
        {/* Type Selector */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'carros', label: 'Carros', icon: <Car className="w-5 h-5" /> },
            { id: 'motos', label: 'Motos', icon: <Bike className="w-5 h-5" /> },
            { id: 'caminhoes', label: 'Caminhões', icon: <Truck className="w-5 h-5" /> },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setVehicleType(type.id as FipeVehicleType)}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                vehicleType === type.id 
                ? 'bg-primary border-primary text-white shadow-lg shadow-blue-100 scale-[1.02]' 
                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
              }`}
            >
              {type.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-gray-800">Parâmetros de Busca</h3>
          </div>

          <div className="space-y-4">
            {/* Brand Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Marca</label>
              {isLoadingBrands ? <DropdownSkeleton /> : (
                <div className="relative">
                  <select 
                    value={selectedBrandId} 
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="">Selecione a marca</option>
                    {brands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                </div>
              )}
            </div>

            {/* Model Dropdown */}
            {(selectedBrandId || isLoadingModels) && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Modelo</label>
                {isLoadingModels ? <DropdownSkeleton /> : (
                  <div className="relative">
                    <select 
                      value={selectedModelId} 
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="">Selecione o modelo</option>
                      {models.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            )}

            {/* Year Dropdown */}
            {(selectedModelId || isLoadingYears) && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ano / Versão</label>
                {isLoadingYears ? <DropdownSkeleton /> : (
                  <div className="relative">
                    <select 
                      value={selectedYearId} 
                      onChange={(e) => handleYearChange(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="">Selecione o ano</option>
                      {years.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Result Card */}
        {isLoadingDetail && (
          <div className="w-full h-48 bg-white border border-gray-100 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 shadow-sm">
             <RefreshCw className="w-8 h-8 text-primary animate-spin" />
             <p className="text-sm font-bold text-gray-400">Buscando cotação atualizada...</p>
          </div>
        )}

        {detail && !isLoadingDetail && (
          <div className="animate-in zoom-in duration-300">
            <div className="bg-white rounded-[32px] shadow-xl shadow-blue-900/5 border border-blue-50 overflow-hidden">
               {/* Accent Header */}
               <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-4 flex justify-between items-center text-white">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80 decoration-white/30 underline underline-offset-4">Resultado da Consulta</span>
                  <BarChart2 className="w-4 h-4 opacity-50" />
               </div>

               <div className="p-6">
                 <h2 className="text-2xl font-black text-gray-900 leading-tight mb-4 tracking-tight">
                    {detail.Modelo}
                 </h2>

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                       <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Fuel className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase">Combustível</span>
                       </div>
                       <p className="text-sm font-bold text-gray-800">{detail.Combustivel}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                       <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <CalendarDays className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase">Ano Modelo</span>
                       </div>
                       <p className="text-sm font-bold text-gray-800">{detail.AnoModelo}</p>
                    </div>
                 </div>

                 <div className="bg-green-50 rounded-[28px] p-6 border-2 border-green-100 text-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform">
                       <DollarSign className="w-24 h-24 text-green-600" />
                    </div>
                    <span className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1 block">Valor na Tabela FIPE</span>
                    <p className="text-3xl font-black text-green-700 tracking-tighter">
                       {detail.Valor}
                    </p>
                    <p className="text-[9px] text-green-600/70 font-bold mt-2 uppercase tracking-wide">Ref: {detail.MesReferencia}</p>
                 </div>

                 <button 
                  onClick={resetAll}
                  className="w-full mt-6 py-4 rounded-2xl text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-2"
                 >
                   <RefreshCw className="w-3 h-3" />
                   Nova Consulta
                 </button>
               </div>
            </div>

            <div className="mt-6 flex items-start gap-3 px-2">
               <div className="p-1.5 bg-blue-50 text-primary rounded-lg mt-0.5">
                  <Info className="w-3 h-3" />
               </div>
               <p className="text-[10px] text-gray-400 italic leading-relaxed font-medium">
                Os preços indicados são uma média de mercado para veículos com estado de conservação padrão e quilometragem média. O valor final pode variar dependendo de acessórios e região.
               </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedBrandId && !isLoadingBrands && (
          <div className="mt-12 flex flex-col items-center text-center px-10">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Car className="w-10 h-10 text-gray-300" />
             </div>
             <h4 className="font-bold text-gray-400 text-sm mb-1">Comece selecionando a marca</h4>
             <p className="text-xs text-gray-400 leading-relaxed font-medium">Selecione os parâmetros acima para visualizar as cotações oficiais do mercado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
