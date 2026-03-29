
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Heart, Share2, MapPin, MessageSquare, User as UserIcon, ChevronRight, Wrench, Tag, Package, CheckCircle, QrCode, Printer, Download, Flag, UserX } from 'lucide-react';
import { generateA4PrintTemplate } from '../services/printTemplates';
import { AdItem, ReportItem, User } from '../types';
import { DeepLinkButton } from '../components/ui/DeepLinkButton';
import { downloadQR, shareAd } from '../utils/mobileActions';
import { Toast } from '../components/Shared';
import { LocationSection } from '../components/LocationSection';
import { APP_URL } from '../constants';
import { ReportModal } from '../components/ReportModal';
import { SmartImage } from '../components/ui/SmartImage';

interface PartServiceDetailsProps {
  ad: AdItem;
  onBack: () => void;
  onStartChat?: () => void;
  onViewProfile?: () => void;
  onReport?: (report: ReportItem) => void;
  onBlockUser?: (userId: string) => void;
  onPrint?: () => void;
}

export const PartServiceDetails: React.FC<PartServiceDetailsProps & { user?: User | null }> = ({ ad, onBack, onStartChat, onViewProfile, onReport, onBlockUser, onPrint, user }) => {
  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-50 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Erro Crítico</h2>
        <p className="text-gray-600 mb-4">Dados do item não encontrados.</p>
        <button onClick={onBack} className="px-6 py-2 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200">
          Voltar
        </button>
      </div>
    );
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'informative' | 'error' } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const images = (ad.images && ad.images.length > 0) ? ad.images : (ad.image ? [ad.image] : ['https://via.placeholder.com/800x600?text=Sem+Imagem']);

  const qrData = `${APP_URL}/anuncio/${ad.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}&color=004AAD&bgcolor=ffffff&margin=10&ecc=H`;

  useEffect(() => {
    // Reset index when ad changes
    setCurrentImageIndex(0);

    // SEO: Update Meta Tags
    if (ad) {
      document.title = `${ad.title} | Feirão da Orca`;
    }
  }, [ad.id]);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleDownloadQR = () => {
    downloadQR(qrCodeUrl, `qr-code-${(ad.title || 'anuncio').replace(/\s+/g, '-').toLowerCase()}.png`, (msg, type) => setToast({ message: msg, type }));
  };

  const handlePrintQR = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = generateA4PrintTemplate(ad, qrCodeUrl);
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const handleShareQR = () => {
    shareAd({ 
      title: ad.title || 'Anúncio', 
      text: `Confira este item: ${ad.title}`, 
      url: qrData 
    }, (msg, type) => setToast({ message: msg, type }));
  };

  const handleReportSubmit = async (reason: string, description: string) => {
    if (onReport) {
      const newReport: ReportItem = {
        id: `rep_${Date.now()}`,
        targetId: ad.id,
        targetName: ad.title || 'Anúncio',
        targetType: 'ad',
        targetImage: ad.image || (ad.images && ad.images[0]) || null,
        reportedUserId: ad.userId, 
        reason: reason,
        description: description,
        reporterId: user?.id || 'guest',
        reporterName: user?.name || 'Convidado',
        severity: 'medium',
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'pending'
      };
      await onReport(newReport);
      setToast({ message: "Denúncia enviada para análise.", type: 'success' });
    } else {
      setToast({ message: "Denúncia enviada com sucesso.", type: 'success' });
    }
    setIsReportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white pb-24 relative animate-in slide-in-from-right duration-300">
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        adTitle={ad.title || "Anúncio"}
      />

      <div className="relative h-72 w-full bg-gray-100 group">
        <SmartImage
          src={images[currentImageIndex]}
          alt={`${ad.title || 'Item'} - Foto ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          skeletonClassName="h-72 w-full"
        />
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-100 hover:bg-black/50"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-100 hover:bg-black/50"><ChevronRight className="w-6 h-6" /></button>
          </>
        )}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
          <button onClick={onBack} className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 pointer-events-auto"><ChevronLeft className="w-6 h-6" /></button>
          <div className="flex gap-3 pointer-events-auto">
            {!ad.isOwner && onBlockUser && (
              <button 
                onClick={(e) => { e.stopPropagation(); onBlockUser(ad.userId); }} 
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-red-500 border border-white/10 transition-all active:scale-90" 
                title="Bloquear Usuário"
              >
                <UserX className="w-6 h-6" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setIsReportModalOpen(true); }} className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-red-500 hover:border-red-500 transition-colors" title="Denunciar"><Flag className="w-6 h-6" /></button>
            <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"><Heart className="w-6 h-6" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleShareQR(); }} className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"><Share2 className="w-6 h-6" /></button>
          </div>
        </div>
        {images.length > 1 && (<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 p-2">{images.map((_, idx) => (<div key={idx} className={`w-2 h-2 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50'}`} />))}</div>)}
      </div>

      <div className="p-5">
        {!user && (
          <div className="mb-6 bg-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-100 text-white animate-in zoom-in duration-500 border border-blue-400">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Download className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-xl leading-tight">Interessado neste item?</h3>
                <p className="text-blue-100 text-xs mt-1 font-bold uppercase tracking-widest">Negocie pelo App!</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <DeepLinkButton adId={ad.id} className="w-full bg-white text-blue-600 py-4 rounded-2xl shadow-lg" />
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"><Wrench className="w-3 h-3" />{ad.partType || "Peças e Serviços"}</span>
          {ad.condition && (<span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${ad.condition === 'Novo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}><Package className="w-3 h-3" />{ad.condition}</span>)}
        </div>

        <h1 className="text-xl font-bold text-gray-900 leading-snug mb-2">{ad.title || "Sem título"}</h1>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-4"><MapPin className="w-4 h-4" /><span>{ad.location || "Localização não informada"}</span></div>

        <div className="mb-6 pb-6 border-b border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900">{(ad.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
        </div>

        {/* Seller Info (Clickable) */}
        <div
          onClick={onViewProfile}
          className="flex items-center gap-4 bg-white border border-gray-100 shadow-sm p-4 rounded-2xl mb-8 cursor-pointer hover:bg-gray-50 transition-colors group active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:border-primary transition-colors">
            {ad.ownerAvatar ? (
              <SmartImage src={ad.ownerAvatar} alt={ad.ownerName || "Vendedor"} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-7 h-7 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">
              {ad.isOwner ? "Eu (Vendedor)" : (ad.ownerName || "Vendedor")}
            </p>
            <p className="text-xs text-secondary-500 font-medium group-hover:underline">Ver perfil</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary" />
        </div>

        {ad.isOwner && (
          <div className="mb-8 bg-blue-50/50 border border-blue-100 p-5 rounded-2xl animate-in fade-in">
            <div className="flex items-center gap-2 mb-4"><QrCode className="w-5 h-5 text-primary" /><h3 className="font-bold text-gray-900">QR Code do Anúncio</h3></div>
            <div className="flex items-center gap-6">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex-shrink-0"><img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 object-contain" /></div>
              <div className="flex flex-col gap-2 flex-1">
                <button onClick={handleDownloadQR} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" /> Baixar / Salvar</button>
                <button onClick={handleShareQR} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"><Share2 className="w-4 h-4" /> Compartilhar</button>
                <button onClick={handlePrintQR} className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg shadow-sm text-xs font-bold hover:bg-primary-dark transition-colors"><Printer className="w-4 h-4" /> Imprimir</button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-2">Descrição</h3>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{ad.description || "Nenhuma descrição fornecida pelo vendedor."}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
          <h4 className="font-bold text-blue-900 text-sm mb-2">Dicas de Segurança</h4>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside"><li>Não faça pagamentos antecipados.</li><li>Verifique o produto pessoalmente antes de comprar.</li><li>Prefira locais públicos para encontros.</li></ul>
        </div>

        <LocationSection ad={ad} />
      </div>

      {(!ad.isOwner) && user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 px-6 flex gap-3 items-center z-[200] max-w-md mx-auto rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
          <button
            onClick={onStartChat}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100/50 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
            <span>Chat</span>
          </button>
          <button
            onClick={handleShareQR}
            className="bg-[#20C961] hover:bg-[#1BAE53] text-white p-4 rounded-2xl shadow-xl shadow-green-200/50 transition-all active:scale-[0.97]"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      )}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type === 'informative' ? 'success' : toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};
