
import React, { useState } from 'react';
import { ChevronLeft, MapPin, Calendar, ShieldCheck, Heart, Clock, Search, Flag, User as UserIcon } from 'lucide-react';
import { PriceTag, Toast } from '../components/Shared';
import { AdItem, User, ReportItem } from '../types';
import { ReportModal } from '../components/ReportModal';

interface PublicProfileProps {
  user: User;
  ads: AdItem[];
  onBack: () => void;
  onAdClick: (ad: AdItem) => void;
  onStartChat: () => void;
  favorites: AdItem[];
  onToggleFavorite: (ad: AdItem) => void;
  onReport?: (report: ReportItem) => void;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({
  user,
  ads,
  onBack,
  onAdClick,
  onStartChat,
  favorites,
  onToggleFavorite,
  onReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter ads by search term
  const filteredAds = ads.filter(ad =>
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReportSubmit = (reason: string, description: string) => {
    if (onReport) {
      const newReport: ReportItem = {
        id: `rep_user_${Date.now()}`,
        adId: user.id || 'unknown_user',
        adTitle: `Perfil: ${user.name}`,
        reason: reason,
        description: description,
        reporterId: 'user_current',
        reporterName: 'Usuário (Você)',
        status: 'pending',
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      };
      onReport(newReport);
      setToastMessage("Denúncia enviada. A equipe analisará o perfil.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300 relative">

      {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        adTitle={`Perfil de ${user.name}`}
      />

      {/* Header Profile Info */}
      <div className="bg-white pb-6 rounded-b-[40px] shadow-sm relative z-10">

        {/* Top Bar */}
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors relative z-50 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="p-2 rounded-full hover:bg-red-50 group transition-colors"
            title="Denunciar Usuário"
          >
            <Flag className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="flex flex-col items-center px-6 -mt-2">
          <div className="relative mb-3">
            <div className="w-28 h-28 rounded-full p-1 bg-white shadow-lg flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            {user.verified && (
              <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Verificado">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">{user.name}</h1>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {user.location || "Brasília, DF"}
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Desde {user.joinDate || "2023"}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex w-full justify-center gap-4 mb-6">
            <div className="flex flex-col items-center bg-gray-50 px-5 py-2 rounded-2xl border border-gray-100 min-w-[80px]">
              <span className="font-bold text-gray-900 text-lg">{ads.length}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Anúncios</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 px-5 py-2 rounded-2xl border border-gray-100 min-w-[80px]">
              <span className="font-bold text-gray-900 text-lg">1h</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Resp. Média</span>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="text-center max-w-xs mb-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                "{user.bio}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ads Section */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Anúncios ativos</h2>

          {/* Simple Search within Profile */}
          <div className="relative w-32">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-full py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-primary transition-all"
            />
            <Search className="w-3 h-3 text-gray-400 absolute left-3 top-2" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredAds.map((ad) => {
            const isFav = favorites.some(f => f.id === ad.id);
            return (
              <div
                key={ad.id}
                onClick={() => onAdClick(ad)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition-all group flex h-32"
              >
                <div className="w-32 h-full relative flex-shrink-0">
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                  {ad.status === 'Vendido' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase border border-white px-2 py-1 rounded">Vendido</span>
                    </div>
                  )}
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
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ad.vehicleType || ad.realEstateType || ad.partType}</p>
                  </div>

                  <div className="flex justify-between items-end">
                    <PriceTag value={ad.price} />
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3" />
                      <span>Ontem</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAds.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">
              Nenhum anúncio encontrado.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
