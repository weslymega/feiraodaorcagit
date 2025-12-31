
import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, Plus, Image as ImageIcon, Calendar, Trash2, 
  Save, X, Loader2, Megaphone, Check, Eye, Edit2, Link as LinkIcon, Home, Car, Wrench, Ban
} from 'lucide-react';
import { BannerItem } from '../types';

interface AdminBannersProps {
  onBack: () => void;
  banners: BannerItem[];
  setBanners: (banners: BannerItem[]) => void;
  vehicleBanners?: BannerItem[];
  setVehicleBanners?: (banners: BannerItem[]) => void;
  realEstateBanners?: BannerItem[]; 
  setRealEstateBanners?: (banners: BannerItem[]) => void; 
  partsServicesBanners?: BannerItem[]; 
  setPartsServicesBanners?: (banners: BannerItem[]) => void; 
}

const GRADIENT_OPTIONS = [
  { id: 'none', class: 'none', name: 'Apenas Imagem (Sem Fundo)' },
  { id: 'blue', class: 'from-blue-900 to-blue-600', name: 'Azul' },
  { id: 'green', class: 'from-emerald-800 to-teal-600', name: 'Verde' },
  { id: 'purple', class: 'from-purple-900 to-indigo-600', name: 'Roxo' },
  { id: 'orange', class: 'from-orange-700 to-yellow-600', name: 'Laranja' },
  { id: 'red', class: 'from-red-800 to-pink-600', name: 'Vermelho' },
  { id: 'dark', class: 'from-gray-900 to-gray-700', name: 'Preto' },
];

export const AdminBanners: React.FC<AdminBannersProps> = ({ 
  onBack, 
  banners, 
  setBanners,
  vehicleBanners = [],
  setVehicleBanners = () => {},
  realEstateBanners = [],
  setRealEstateBanners = () => {},
  partsServicesBanners = [],
  setPartsServicesBanners = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'real_estate' | 'parts'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine which list we are editing
  let currentList = banners;
  let updateList = setBanners;
  let tabName = "Dashboard";
  let idPrefix = "ban_";

  if (activeTab === 'vehicles') {
      currentList = vehicleBanners;
      updateList = setVehicleBanners;
      tabName = "Veículos";
      idPrefix = "v_ban_";
  } else if (activeTab === 'real_estate') {
      currentList = realEstateBanners;
      updateList = setRealEstateBanners;
      tabName = "Imóveis";
      idPrefix = "r_ban_";
  } else if (activeTab === 'parts') {
      currentList = partsServicesBanners;
      updateList = setPartsServicesBanners;
      tabName = "Peças e Serviços";
      idPrefix = "p_ban_";
  }

  // Form State
  const [formData, setFormData] = useState<Partial<BannerItem>>({
    id: '', 
    title: '',
    subtitle: '',
    category: '',
    buttonText: '',
    link: '',
    gradient: 'from-blue-900 to-blue-600',
    active: true,
    expiresAt: ''
  });

  const handleEdit = (banner: BannerItem) => {
    setFormData(banner);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setFormData({
      id: '',
      title: '',
      subtitle: '',
      category: '',
      buttonText: 'Ver Mais',
      link: '',
      gradient: 'from-blue-900 to-blue-600',
      active: true,
      expiresAt: '',
      image: ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este banner?')) {
      updateList(currentList.filter(b => b.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    updateList(currentList.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  // Image Upload Helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image || !formData.expiresAt) {
      alert("É necessário enviar uma imagem e definir a data de validade.");
      return;
    }

    if (formData.id) {
      // Edição
      updateList(currentList.map(b => b.id === formData.id ? { ...b, ...formData } as BannerItem : b));
    } else {
      // Criação
      const newBanner: BannerItem = {
        id: idPrefix + Date.now().toString(),
        title: formData.title || '',
        subtitle: formData.subtitle || '',
        category: formData.category || '',
        buttonText: formData.buttonText || '',
        image: formData.image || '',
        gradient: formData.gradient || 'from-blue-900 to-blue-600',
        expiresAt: formData.expiresAt || new Date().toISOString(),
        active: formData.active !== undefined ? formData.active : true,
        link: formData.link
      };
      updateList([...currentList, newBanner]);
    }

    setIsFormOpen(false);
  };

  const renderBannerPreview = (banner: Partial<BannerItem>) => {
    const hasText = !!banner.title;
    const isTransparent = banner.gradient === 'none';
    
    // Banners de veículos/imoveis/pecas são menores (h-32) vs Dashboard (h-40)
    const heightClass = activeTab === 'dashboard' ? 'h-40' : 'h-32';

    return (
      <div className={`w-full ${heightClass} rounded-2xl relative overflow-hidden shadow-lg ${hasText && !isTransparent ? `bg-gradient-to-r ${banner.gradient}` : 'bg-gray-900'}`}>
         
         {/* Se tiver texto, mostra layout com texto */}
         {hasText && (
             <div className="relative z-10 w-2/3 pl-6 pr-2 py-4 text-white flex flex-col justify-center h-full">
                {banner.category && (
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-2 border border-white/10 shadow-sm">
                    {banner.category}
                  </span>
                )}
                <h2 className="text-xl font-bold leading-tight mb-1 line-clamp-2 drop-shadow-md">{banner.title}</h2>
                <p className="text-xs opacity-90 mb-3 font-medium text-blue-50 line-clamp-1 drop-shadow-md">{banner.subtitle}</p>
                {banner.buttonText && (
                  <button className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-md w-fit flex items-center gap-1 pointer-events-none">
                    {banner.buttonText}
                  </button>
                )}
             </div>
         )}

         {/* Imagem de Fundo ou Lateral */}
         <div className={`absolute right-0 top-0 bottom-0 ${hasText && !isTransparent ? 'w-1/2' : 'w-full'} h-full`}>
            {banner.image ? (
              <img 
                src={banner.image} 
                alt="Preview" 
                className={`w-full h-full object-cover ${hasText && !isTransparent ? 'mask-linear-left opacity-90' : 'opacity-100'}`}
                style={hasText && !isTransparent ? { maskImage: 'linear-gradient(to left, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)' } : {}}
              />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-200">
                   <ImageIcon className="w-8 h-8 mb-2" />
                   <span className="text-xs">Imagem</span>
                </div>
            )}
            
            {/* Overlay sutil para garantir leitura de texto em modo "Apenas Imagem" se houver texto */}
            {isTransparent && hasText && (
                <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
            )}
         </div>
      </div>
    );
  };

  if (isFormOpen) {
    return (
      <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => setIsFormOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{formData.id ? 'Editar Propaganda' : 'Nova Propaganda'}</h1>
        </div>

        <div className="bg-blue-50 px-4 py-2 text-center border-b border-blue-100">
            <span className="text-xs font-bold text-blue-700">
                Editando para: {tabName}
            </span>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          
          {/* Preview */}
          <div className="mb-2">
             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pré-visualização</label>
             {renderBannerPreview(formData)}
          </div>

          {/* Image Upload */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
             <label className="block text-sm font-bold text-gray-900 mb-3">Imagem do Banner (Obrigatório)</label>
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
             >
                {isUploading ? (
                   <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : formData.image ? (
                   <div className="flex flex-col items-center">
                      <Check className="w-8 h-8 text-green-500 mb-1" />
                      <span className="text-xs text-gray-500">Imagem carregada (Toque para alterar)</span>
                   </div>
                ) : (
                   <div className="flex flex-col items-center text-gray-400">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs">Carregar Imagem (Max 2MB)</span>
                   </div>
                )}
             </div>
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          {/* Link Section */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
             <label className="block text-sm font-bold text-gray-700 mb-1">Link de Destino (Opcional)</label>
             <div className="relative">
                <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  type="url" 
                  value={formData.link || ''} 
                  onChange={e => setFormData({...formData, link: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-all font-medium"
                  placeholder="https://site-da-empresa.com"
                />
             </div>
             <p className="text-xs text-gray-500 mt-2">
                Se preenchido, o usuário será redirecionado para este site ao clicar no banner.
             </p>
          </div>

          {/* Text Fields (Optional) */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <Megaphone className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-bold text-gray-900">Informações de Texto (Opcional)</span>
             </div>
             <p className="text-xs text-gray-500 -mt-2 mb-4">Deixe os campos abaixo vazios se quiser usar apenas a imagem carregada.</p>

             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary"
                  placeholder="Ex: Oferta de Verão"
               />
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Subtítulo</label>
                <input 
                  type="text" 
                  value={formData.subtitle} 
                  onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary"
                  placeholder="Ex: Descontos de até 50%"
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Categoria (Tag)</label>
                   <input 
                     type="text" 
                     value={formData.category} 
                     onChange={e => setFormData({...formData, category: e.target.value})}
                     className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary"
                     placeholder="Ex: Promoção"
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Texto Botão</label>
                   <input 
                     type="text" 
                     value={formData.buttonText} 
                     onChange={e => setFormData({...formData, buttonText: e.target.value})}
                     className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary"
                     placeholder="Ver Mais"
                   />
                </div>
             </div>
          </div>

          {/* Style & Settings */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tema (Cor de Fundo)</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                   {GRADIENT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({...formData, gradient: opt.class})}
                        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                            opt.id === 'none' 
                                ? 'bg-white border-2 border-gray-300' 
                                : `bg-gradient-to-r ${opt.class}`
                        } ${formData.gradient === opt.class ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                        title={opt.name}
                      >
                          {opt.id === 'none' && <Ban className="w-5 h-5 text-gray-400" />}
                      </button>
                   ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Selecione o ícone "Bloqueio" para usar apenas a imagem sem cor de fundo.</p>
             </div>

             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Data de Expiração (Obrigatório)</label>
                <input 
                  type="date" 
                  value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''} 
                  onChange={e => setFormData({...formData, expiresAt: new Date(e.target.value).toISOString()})}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary"
                  required
                />
             </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
             <Save className="w-5 h-5" /> Salvar Propaganda
          </button>

        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300">
      
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Gerenciar Propagandas</h1>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-purple-100 text-purple-700 p-2 rounded-full hover:bg-purple-200 transition-colors"
        >
           <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="px-4 py-4 bg-gray-50/50">
         <div className="flex bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
               <Home className="w-4 h-4" />
               Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'vehicles' 
                  ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
               <Car className="w-4 h-4" />
               Veículos
            </button>
            <button 
              onClick={() => setActiveTab('real_estate')}
              className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'real_estate' 
                  ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
               <Home className="w-4 h-4" />
               Imóveis
            </button>
            <button 
              onClick={() => setActiveTab('parts')}
              className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'parts' 
                  ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
               <Wrench className="w-4 h-4" />
               Peças
            </button>
         </div>
      </div>

      <div className="px-4 space-y-4 pb-4">
         {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <Megaphone className="w-12 h-12 mb-2 text-gray-300" />
               <p>Nenhuma propaganda cadastrada nesta seção.</p>
            </div>
         ) : (
            currentList.map(banner => {
               const hasText = !!banner.title;
               const isTransparent = banner.gradient === 'none';
               const heightClass = activeTab === 'dashboard' ? 'h-32' : 'h-24'; // Smaller preview in list

               return (
                 <div key={banner.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className={`${heightClass} w-full relative`}>
                       {/* Lógica de Renderização na Lista */}
                       {hasText ? (
                         <>
                           <img 
                             src={banner.image} 
                             className="w-full h-full object-cover" 
                             style={!isTransparent ? { maskImage: 'linear-gradient(to left, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)' } : {}}
                           />
                           {!isTransparent && (
                               <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${banner.gradient}`}></div>
                           )}
                           
                           {/* Texto (se não for transparente, ou se for mas tiver overlay) */}
                           <div className="absolute top-0 left-0 p-4 w-2/3">
                              {banner.category && <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded font-bold shadow-sm">{banner.category}</span>}
                              <h3 className="text-white font-bold text-base leading-tight mt-1 truncate drop-shadow-md">{banner.title}</h3>
                              <p className="text-white/80 text-[10px] truncate drop-shadow-md">{banner.subtitle}</p>
                           </div>
                           
                           {/* Se for transparente, adiciona um overlay leve apenas na lista para garantir leitura se tiver texto, mas o preview real é limpo */}
                           {isTransparent && <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none"></div>}
                         </>
                       ) : (
                         <img 
                           src={banner.image} 
                           className="w-full h-full object-cover" 
                         />
                       )}

                       {/* Link Indicator Badge */}
                       {banner.link && (
                          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-md flex items-center gap-1 z-10">
                             <LinkIcon className="w-3 h-3" />
                             <span className="text-[9px] font-medium truncate max-w-[100px]">{banner.link}</span>
                          </div>
                       )}

                       <div className="absolute top-2 right-2 flex gap-2 z-10">
                          <button 
                            onClick={() => handleToggleActive(banner.id)}
                            className={`p-1.5 rounded-full backdrop-blur-md ${banner.active ? 'bg-green-500 text-white' : 'bg-gray-500/50 text-gray-200'}`}
                            title={banner.active ? "Ativo" : "Inativo"}
                          >
                             {banner.active ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-50" />}
                          </button>
                          
                          <button 
                            onClick={() => handleEdit(banner)}
                            className="p-1.5 bg-blue-500 text-white rounded-full backdrop-blur-md hover:bg-blue-600"
                            title="Editar"
                          >
                             <Edit2 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleDelete(banner.id)}
                            className="p-1.5 bg-red-500 text-white rounded-full backdrop-blur-md hover:bg-red-600"
                            title="Excluir"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                    
                    <div className="p-3 flex justify-between items-center bg-gray-50">
                       <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          Expira: {new Date(banner.expiresAt).toLocaleDateString('pt-BR')}
                       </div>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {banner.active ? 'Ativo' : 'Pausado'}
                       </span>
                    </div>
                 </div>
               );
            })
         )}
      </div>
    </div>
  );
};
