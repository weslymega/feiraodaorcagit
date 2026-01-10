
import React, { useState, useMemo } from 'react';
import {
   ChevronLeft, Search, Wrench, CheckCircle, XCircle, Package,
   MapPin, User as UserIcon, Filter, Clock, ChevronRight,
   FileText, Tag, Sparkles
} from 'lucide-react';
import { AdItem, AdStatus, Screen } from '../types';
import { MOCK_ADMIN_PARTS_SERVICES } from '../constants';
import { PriceTag } from '../components/Shared';

interface AdminPartsServicesAdsProps {
   onBack: () => void;
   ads: AdItem[];
   onUpdateAd: (id: string, status: AdStatus) => void;
   onNavigate: (screen: Screen) => void;
}

const StatCard: React.FC<{
   title: string;
   value: number;
   icon: React.ReactNode;
   bgClass: string;
   textClass: string;
}> = ({ title, value, icon, bgClass, textClass }) => (
   <div className={`p-4 rounded-2xl border flex flex-col justify-between h-28 ${bgClass} border-transparent`}>
      <div className="flex justify-between items-start">
         <span className={`${textClass} text-xs font-bold uppercase tracking-wider opacity-80`}>{title}</span>
         <div className={`p-2 rounded-full bg-white/30 backdrop-blur-sm ${textClass}`}>
            {icon}
         </div>
      </div>
      <span className={`text-3xl font-bold ${textClass}`}>{value}</span>
   </div>
);

const FilterTab: React.FC<{
   label: string;
   isActive: boolean;
   onClick: () => void;
   count?: number;
}> = ({ label, isActive, onClick, count }) => (
   <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${isActive
         ? 'bg-primary text-white shadow-md'
         : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
         }`}
   >
      {label}
      {count !== undefined && (
         <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {count}
         </span>
      )}
   </button>
);

// Componente auxiliar para detalhes técnicos
const SpecItem: React.FC<{ label: string; value: string | number; icon?: React.ReactNode }> = ({ label, value, icon }) => (
   <div className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-1.5 mb-1">
         {icon && <div className="text-gray-400">{icon}</div>}
         <span className="text-gray-400 text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-gray-900 font-bold text-sm truncate">{value}</span>
   </div>
);

export const AdminPartsServicesAds: React.FC<AdminPartsServicesAdsProps> = ({ onBack, ads, onUpdateAd, onNavigate }) => {
   const initialTab = ads.some(ad => ad.status === AdStatus.PENDING) ? 'PENDING' : 'ALL';
   const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED'>(initialTab);
   const [searchTerm, setSearchTerm] = useState('');

   // Estado para controlar qual anúncio está sendo visualizado em detalhes
   const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
   const [currentImageIndex, setCurrentImageIndex] = useState(0);

   const selectedAd = useMemo(() =>
      ads.find(ad => ad.id === selectedAdId) || null
      , [ads, selectedAdId]);

   // --- DERIVED STATS ---
   const stats = useMemo(() => {
      return {
         total: ads.length,
         pending: ads.filter(ad => ad.status === AdStatus.PENDING).length,
         active: ads.filter(ad => ad.status === AdStatus.ACTIVE).length,
         rejected: ads.filter(ad => ad.status === AdStatus.REJECTED).length,
      };
   }, [ads]);

   // --- FILTERING ---
   const filteredAds = useMemo(() => {
      return ads.filter(ad => {
         // 1. Status Filter
         if (activeTab === 'PENDING' && ad.status !== AdStatus.PENDING) return false;
         if (activeTab === 'ACTIVE' && ad.status !== AdStatus.ACTIVE) return false;
         if (activeTab === 'REJECTED' && ad.status !== AdStatus.REJECTED) return false;

         // 2. Search Filter
         if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            const matchesTitle = ad.title.toLowerCase().includes(lowerSearch);
            const matchesOwner = ad.ownerName?.toLowerCase().includes(lowerSearch);
            const matchesType = ad.partType?.toLowerCase().includes(lowerSearch);
            if (!matchesTitle && !matchesOwner && !matchesType) return false;
         }

         return true;
      });
   }, [ads, activeTab, searchTerm]);

   // --- ACTIONS ---
   const handleStatusChange = (id: string, newStatus: AdStatus) => {
      onUpdateAd(id, newStatus);

      // Se estiver na tela de detalhes, volta para a lista após ação (opcional, para agilidade)
      if (newStatus === AdStatus.ACTIVE || newStatus === AdStatus.REJECTED) {
         setSelectedAdId(null);
      }
   };

   const handleCardClick = (ad: AdItem) => {
      setSelectedAdId(ad.id);
      setCurrentImageIndex(0);
   };

   // --- RENDER DETAIL VIEW ---
   if (selectedAd) {
      const images = selectedAd.images && selectedAd.images.length > 0 ? selectedAd.images : [selectedAd.image];

      return (
         <div className="min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300 relative">

            {/* Detail Header */}
            <div className="bg-white px-4 py-4 sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 shadow-sm">
               <button onClick={() => setSelectedAdId(null)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
               </button>
               <h1 className="text-lg font-bold text-gray-900">Moderação de Item</h1>
               <div className="w-8"></div>
            </div>

            {/* Content */}
            <div className="pb-24">
               {/* Image Gallery */}
               <div className="relative h-64 bg-gray-900">
                  <img src={images[currentImageIndex]} className="w-full h-full object-cover" alt="Item" />
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                     {currentImageIndex + 1} / {images.length}
                  </div>
                  {/* Status Badge */}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold uppercase shadow-sm ${selectedAd.status === AdStatus.PENDING ? 'bg-orange-500 text-white' :
                     selectedAd.status === AdStatus.ACTIVE ? 'bg-green-500 text-white' :
                        'bg-red-500 text-white'
                     }`}>
                     {selectedAd.status}
                  </div>
               </div>

               <div className="p-5 space-y-6">

                  {/* Title & Price */}
                  <div>
                     <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded mb-2 inline-block">
                        {selectedAd.category === 'servicos' ? 'Serviço' : 'Peça/Acessório'}
                     </span>
                     <h2 className="text-xl font-bold text-gray-900 leading-snug mb-1">{selectedAd.title}</h2>
                     <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Publicado em {selectedAd.date}
                     </p>
                     <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold text-primary">R$ {selectedAd.price.toLocaleString('pt-BR')}</span>
                     </div>
                  </div>

                  {/* User Info */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                     <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-400" />
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Anunciante</p>
                        <p className="font-bold text-gray-900">{selectedAd.ownerName || 'Usuário Desconhecido'}</p>
                        <p className="text-xs text-gray-400">ID: {selectedAd.id.split('_')[0] || 'U123'}</p>
                     </div>
                  </div>

                  {/* Specs Grid */}
                  <div>
                     <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-gray-500" /> Detalhes do Item
                     </h3>
                     <div className="grid grid-cols-2 gap-3">
                        <SpecItem icon={<Tag className="w-3.5 h-3.5" />} label="Categoria" value={selectedAd.partType || '-'} />
                        <SpecItem icon={<Package className="w-3.5 h-3.5" />} label="Condição" value={selectedAd.condition || 'N/A'} />
                        <SpecItem icon={<MapPin className="w-3.5 h-3.5" />} label="Local" value={selectedAd.location} />
                        <SpecItem label="ID" value={selectedAd.id} />
                     </div>
                  </div>

                  {/* Description */}
                  <div>
                     <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" /> Descrição do Vendedor
                     </h3>
                     <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {selectedAd.description || 'Sem descrição fornecida.'}
                     </div>
                  </div>

               </div>
            </div>

            {/* Sticky Action Footer - Fixed Proportions */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
               <div className="w-full max-w-md bg-white border-t border-gray-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] pointer-events-auto">
                  {selectedAd.status === AdStatus.PENDING ? (
                     <div className="flex gap-3">
                        <button
                           onClick={() => handleStatusChange(selectedAd.id, AdStatus.REJECTED)}
                           className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                           <XCircle className="w-5 h-5" /> Rejeitar
                        </button>
                        <button
                           onClick={() => handleStatusChange(selectedAd.id, AdStatus.ACTIVE)}
                           className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                           <CheckCircle className="w-5 h-5" /> Aprovar
                        </button>
                     </div>
                  ) : (
                     <div className="flex gap-3">
                        <button
                           onClick={() => {
                              const action = selectedAd.status === AdStatus.ACTIVE ? AdStatus.INACTIVE : AdStatus.ACTIVE;
                              handleStatusChange(selectedAd.id, action);
                           }}
                           className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors text-sm"
                        >
                           {selectedAd.status === AdStatus.ACTIVE ? 'Pausar' : 'Reativar'}
                        </button>
                        <button
                           onClick={() => handleStatusChange(selectedAd.id, AdStatus.REJECTED)}
                           className="py-3 px-6 rounded-xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors text-sm"
                        >
                           Remover
                        </button>
                     </div>
                  )}
               </div>
            </div>

         </div>
      );
   }

   // --- RENDER LIST VIEW ---
   return (
      <div className="min-h-screen bg-gray-50 pb-20 animate-in slide-in-from-right duration-300">

         {/* Header */}
         <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 shadow-sm">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
               <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Gerenciar Peças e Serviços</h1>
         </div>

         <div className="p-4 space-y-6">

            {/* KPI Stats */}
            <div className="grid grid-cols-2 gap-3">
               <StatCard
                  title="Total de Itens"
                  value={stats.total}
                  icon={<Wrench className="w-5 h-5" />}
                  bgClass="bg-blue-500 text-white"
                  textClass="text-white"
               />
               <StatCard
                  title="Pendentes Aprovação"
                  value={stats.pending}
                  icon={<Clock className="w-5 h-5" />}
                  bgClass="bg-orange-100 text-orange-700 border-orange-200"
                  textClass="text-orange-800"
               />
            </div>

            {/* Search & Filter */}
            <div className="space-y-4">
               <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Buscar por título ou vendedor..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  />
               </div>

               <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <FilterTab label="Todos" isActive={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} count={stats.total} />
                  <FilterTab label="Pendentes" isActive={activeTab === 'PENDING'} onClick={() => setActiveTab('PENDING')} count={stats.pending} />
                  <FilterTab label="Aprovados" isActive={activeTab === 'ACTIVE'} onClick={() => setActiveTab('ACTIVE')} count={stats.active} />
                  <FilterTab label="Rejeitados" isActive={activeTab === 'REJECTED'} onClick={() => setActiveTab('REJECTED')} count={stats.rejected} />
               </div>
            </div>

            {/* Ads List */}
            <div className="flex flex-col gap-4">
               {filteredAds.length > 0 ? (
                  filteredAds.map((ad) => (
                     <div
                        key={ad.id}
                        onClick={() => handleCardClick(ad)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer active:scale-[0.99] transition-transform hover:shadow-md"
                     >
                        {/* Card Header Info */}
                        <div className="flex p-3 gap-3 border-b border-gray-50">
                           <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                              <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                              {ad.status === AdStatus.PENDING && (
                                 <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-white drop-shadow-md" />
                                 </div>
                              )}
                              <div className="absolute top-0 left-0 bg-black/60 px-1.5 py-0.5 rounded-br-lg">
                                 <span className="text-[9px] font-bold text-white uppercase">{ad.condition || 'N/A'}</span>
                              </div>
                           </div>
                           <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                 <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${ad.status === AdStatus.PENDING ? 'bg-orange-100 text-orange-700' :
                                       ad.status === AdStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                                          'bg-red-100 text-red-700'
                                       }`}>
                                       {ad.status}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{ad.date}</span>
                                 </div>
                                 <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{ad.title}</h3>
                              </div>
                              <div className="flex justify-between items-end">
                                 <PriceTag value={ad.price} />
                                 <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                                    <UserIcon className="w-3 h-3" /> {ad.ownerName || 'Anônimo'}
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center justify-center pl-1">
                              <ChevronRight className="w-5 h-5 text-gray-300" />
                           </div>
                        </div>

                        {/* Card Details Row */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 text-xs text-gray-600">
                           <div className="flex items-center gap-1 font-bold">
                              {ad.category === 'servicos' ? <Sparkles className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                              {ad.partType}
                           </div>
                           <div className="w-px h-3 bg-gray-300"></div>
                           <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {ad.location}
                           </div>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                     <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Filter className="w-8 h-8 text-gray-300" />
                     </div>
                     <p className="font-medium">Nenhum item encontrado.</p>
                     <button onClick={() => { setActiveTab('ALL'); setSearchTerm(''); }} className="text-primary text-xs font-bold mt-2 hover:underline">
                        Limpar Filtros
                     </button>
                  </div>
               )}
            </div>

         </div>
      </div>
   );
};
