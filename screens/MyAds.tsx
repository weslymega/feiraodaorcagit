
import React, { useState } from 'react';
import { Plus, MoreVertical, Trash2, Edit2, X, AlertTriangle, Clock, TrendingUp, Calendar, Zap, Lock, Info } from 'lucide-react';
import { Header, PriceTag } from '../components/Shared';
import { AdItem, AdStatus } from '../types';

interface MyAdsProps {
  ads: AdItem[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onEdit: (ad: AdItem) => void;
  onCreateNew?: () => void;
  onAdClick?: (ad: AdItem) => void;
  initialTab?: 'ativos' | 'inativos' | 'pendentes';
}

export const MyAds: React.FC<MyAdsProps> = ({ ads, onBack, onDelete, onEdit, onCreateNew, onAdClick, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'ativos' | 'inativos' | 'pendentes'>(initialTab || 'ativos');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // States for Modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editAd, setEditAd] = useState<AdItem | null>(null);

  // Group Pending with Active in the tab logic, but they are technically distinct states
  const filteredAds = ads.filter(ad => {
    if (activeTab === 'ativos') return ad.status === AdStatus.ACTIVE;
    if (activeTab === 'pendentes') return ad.status === AdStatus.PENDING || ad.status === AdStatus.REJECTED;
    if (activeTab === 'inativos') return ad.status === AdStatus.INACTIVE || ad.status === AdStatus.SOLD;
    return false;
  });

  const pendingCount = ads.filter(ad => ad.status === AdStatus.PENDING || ad.status === AdStatus.REJECTED).length;

  const toggleMenu = (id: string) => {
    if (activeMenuId === id) {
      setActiveMenuId(null);
    } else {
      setActiveMenuId(id);
    }
  };

  const handleEditClick = (ad: AdItem) => {
    // Cannot edit pending ads usually, but we allow viewing
    if (ad.status === AdStatus.PENDING) {
      alert("Anúncios em análise não podem ser editados no momento.");
      setActiveMenuId(null);
      return;
    }
    setEditAd(ad);
    setActiveMenuId(null);
  };

  const confirmEdit = () => {
    if (editAd) {
      onEdit(editAd);
      setEditAd(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setActiveMenuId(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (expiryDate?: string) => {
    if (!expiryDate) return 0;
    const end = new Date(expiryDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  // Helper to format next bump date
  const formatNextBump = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Helper to check if the ad being edited is a paid plan
  const isPaidAd = editAd && (
    editAd.isFeatured ||
    (editAd.boostPlan && editAd.boostPlan !== 'gratis')
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24" onClick={() => setActiveMenuId(null)}>
      <Header title="Meus Anúncios" onBack={onBack} />

      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('ativos')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'ativos' ? 'border-primary text-primary' : 'border-transparent text-gray-400'
            }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setActiveTab('pendentes')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex justify-center items-center gap-1 ${activeTab === 'pendentes' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'
            }`}
        >
          Pendentes
          {pendingCount > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 rounded-full">{pendingCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('inativos')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'inativos' ? 'border-gray-500 text-gray-600' : 'border-transparent text-gray-400'
            }`}
        >
          Histórico
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 mt-2">
        {filteredAds.map((ad) => (
          <div
            key={ad.id}
            onClick={() => onAdClick && onAdClick(ad)}
            className={`bg-white p-4 rounded-2xl shadow-sm border flex flex-col gap-3 relative active:scale-[0.99] transition-transform cursor-pointer overflow-hidden ${ad.status === AdStatus.PENDING ? 'border-orange-200 bg-orange-50/20' :
                ad.status === AdStatus.REJECTED ? 'border-red-200 bg-red-50/20' :
                  ad.isFeatured ? 'border-l-4 border-l-accent border-y-gray-100 border-r-gray-100' : 'border-gray-100'
              }`}
          >
            {/* Boost Visual Indicator (Background watermark for premium) */}
            {ad.boostPlan === 'premium' && ad.status === AdStatus.ACTIVE && (
              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                <TrendingUp className="w-24 h-24" />
              </div>
            )}

            <div className="flex justify-between items-start z-10">
              <div className="flex gap-2 items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${ad.status === AdStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                    ad.status === AdStatus.PENDING ? 'bg-orange-100 text-orange-700' :
                      ad.status === AdStatus.REJECTED ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                  }`}>
                  {ad.status === AdStatus.PENDING && <Clock className="w-3 h-3" />}
                  {ad.status === AdStatus.REJECTED && <AlertTriangle className="w-3 h-3" />}
                  {ad.status}
                </span>

                {ad.isFeatured && ad.boostConfig && ad.status === AdStatus.ACTIVE && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {ad.boostPlan === 'premium' ? 'Turbo Máx' : ad.boostPlan === 'advanced' ? 'Turbo Ágil' : 'Turbo'}
                  </span>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(ad.id);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {activeMenuId === ad.id ? (
                    <X className="w-5 h-5 text-gray-600" />
                  ) : (
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {activeMenuId === ad.id && (
                  <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 w-40 overflow-hidden z-20 animate-in fade-in zoom-in duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(ad);
                      }}
                      disabled={ad.status === AdStatus.PENDING}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${ad.status === AdStatus.PENDING ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                    >
                      {ad.status === AdStatus.PENDING ? <Lock className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      Editar
                    </button>
                    <div className="h-[1px] bg-gray-100"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(ad.id);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">{ad.title}</h3>
                <PriceTag value={ad.price} />
                {ad.status === AdStatus.REJECTED && (
                  <p className="text-red-500 text-xs mt-2 font-medium">Motivo: Não cumpre as diretrizes.</p>
                )}
                {ad.status === AdStatus.PENDING && (
                  <p className="text-orange-500 text-xs mt-2 font-medium animate-pulse">Aguardando revisão da equipe.</p>
                )}
                {ad.status === AdStatus.ACTIVE && (
                  <p className="text-gray-400 text-xs mt-1">Visitas: 124 • Likes: 12</p>
                )}
              </div>
              <img src={ad.image} alt={ad.title} className="w-28 h-20 object-cover rounded-lg bg-gray-100" />
            </div>

            {/* --- BOOST STATUS INFO SECTION --- */}
            {ad.isFeatured && ad.boostConfig && ad.status === AdStatus.ACTIVE && (
              <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center text-gray-600">
                  <span className="flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5 text-primary" /> Expira em:</span>
                  <span className="font-bold text-gray-800">{getDaysRemaining(ad.boostConfig.expiresAt)} dias</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-accent h-full rounded-full" style={{ width: `${(getDaysRemaining(ad.boostConfig.expiresAt) / (ad.boostConfig.totalBumps * 3)) * 100}%` }}></div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-gray-200 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Próxima Subida</span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {formatNextBump(ad.boostConfig.nextBumpDate)}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Restantes</span>
                    <span className="font-bold text-gray-800">{ad.boostConfig.bumpsRemaining} / {ad.boostConfig.totalBumps}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredAds.length === 0 && (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-8 h-8 text-gray-300" />
            </div>
            <p>Nenhum anúncio nesta categoria.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={onCreateNew}
          className="bg-accent hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-green-200 flex items-center gap-2 transition-colors active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Anunciar novo</span>
        </button>
      </div>

      {/* --- MODAL DE EXCLUSÃO --- */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Excluir Anúncio?</h3>
            <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
              Tem certeza que deseja remover este anúncio? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE AVISO EDIÇÃO --- */}
      {editAd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${isPaidAd ? 'bg-amber-50' : 'bg-blue-50'}`}>
              {isPaidAd ? <AlertTriangle className="w-8 h-8 text-amber-500" /> : <Clock className="w-8 h-8 text-blue-500" />}
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              {isPaidAd ? 'Edição de Destaque' : 'Atenção ao Editar'}
            </h3>
            <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
              {isPaidAd
                ? <>Você pode alterar as informações, mas o <strong>plano contratado será mantido</strong>. As alterações passarão por uma nova análise de até <strong>24 horas</strong>.</>
                : <>Ao editar este anúncio, você só poderá realizar novas alterações <strong>24 horas</strong> após a publicação.</>
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEditAd(null)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmEdit}
                className={`flex-1 py-3.5 text-white font-bold rounded-xl shadow-lg transition-colors ${isPaidAd
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
