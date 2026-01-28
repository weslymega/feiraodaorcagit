
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Heart, Share2, Calculator, MapPin, MessageSquare, Phone, User as UserIcon, ChevronRight, QrCode, Printer, Download, Map, Clock, Camera, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { AdItem, ReportItem } from '../types';
import { ReportModal } from '../components/ReportModal';
import { Toast } from '../components/Shared';

interface VehicleDetailsProps {
  ad: AdItem;
  onBack: () => void;
  onStartChat?: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onToggleFairPresence: () => void;
  onViewProfile?: () => void;
  onReport?: (report: ReportItem) => void;
}

// Helper component for specs
const SpecItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
    <span className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">{label}</span>
    <span className="text-gray-900 font-bold text-sm">{value}</span>
  </div>
);

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ ad, onBack, onStartChat, isFavorite, onToggleFavorite, onToggleFairPresence, onViewProfile, onReport }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Robust Image Handling
  const safeImages = (ad.images && ad.images.length > 0)
    ? ad.images
    : (ad.image ? [ad.image] : ['https://via.placeholder.com/800x600?text=Sem+Imagem']);

  const images = safeImages;
  const features = ad.features || ["Air bag", "Alarme", "Ar condicionado", "Trava elétrica", "Som", "Vidro elétrico"];

  const qrData = `https://feiraodaorca.app/ad/${ad.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=004AAD&bgcolor=ffffff&margin=10`;

  useEffect(() => {
    // Reset index when ad changes
    setCurrentImageIndex(0);
  }, [ad.id]);

  useEffect(() => {
    // Safe access to fairPresence
    const fair = ad?.fairPresence;
    if (fair?.active && fair?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expires = new Date(fair.expiresAt).getTime();
        const diff = expires - now;

        if (diff <= 0) {
          setTimeLeft('Expirado');
          clearInterval(interval);
        } else {
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m restantes`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [ad?.fairPresence, ad?.id]);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const truncateTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length > 5) {
      return words.slice(0, 5).join(' ') + '...';
    }
    return title;
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${(ad?.title || 'anuncio').replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Erro ao baixar QR Code");
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html><body><h1>${ad.title}</h1><img src="${qrCodeUrl}" onload="setTimeout(function(){ window.print(); window.close(); }, 500);" /></body></html>
      `);
      printWindow.document.close();
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: ad.title, text: `Confira este veículo: ${ad.title}`, url: qrData });
      } catch (error) { console.log('Erro ao compartilhar', error); }
    } else {
      alert("Compartilhamento não suportado neste dispositivo.");
    }
  };

  const handleReportSubmit = async (reason: string, description: string) => {
    if (onReport) {
      const newReport: ReportItem = {
        id: `rep_${Date.now()}`,
        targetId: ad.id,
        targetName: ad.title || 'Anúncio',
        targetType: 'ad',
        targetImage: ad.image || (ad.images && ad.images[0]) || null,
        reportedUserId: ad.user_id, // CRITICAL: Link the report to the owner
        reason: reason,
        description: description,
        reporterId: 'user_current',
        reporterName: 'Usuário (Você)',
        severity: 'medium',
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'pending'
      };
      await onReport(newReport);
      setToastMessage("Denúncia enviada para análise.");
    } else {
      console.log('Report submitted:', { adId: ad.id, reason, description });
      setToastMessage("Denúncia enviada com sucesso.");
    }
  };

  const getFipeComparison = () => {
    const price = Number(ad.price);
    const fipePrice = Number(ad.fipePrice);

    if (!fipePrice || !price || fipePrice <= 0) return null;

    const diff = price - fipePrice;
    const percentage = Math.abs((diff / fipePrice) * 100);

    if (isNaN(percentage)) return null;

    if (diff < 0) return { text: `${percentage.toFixed(1)}% abaixo da FIPE`, color: 'text-green-600', bg: 'bg-green-100' };
    else if (diff > 0) return { text: `${percentage.toFixed(1)}% acima da FIPE`, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: `No preço da FIPE`, color: 'text-blue-600', bg: 'bg-blue-100' };
  };

  const comparison = getFipeComparison();

  // --- SAFETY CHECK FOR RENDER ---
  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-50 text-center">
        <h2 className="text-xl font-bold text-red-800 mb-2">Erro Crítico</h2>
        <p className="text-red-600 mb-4">Dados do veículo corrompidos ou não encontrados.</p>
        <button onClick={onBack} className="px-6 py-2 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200">
          Voltar
        </button>
      </div>
    );
  }

  // Debugging Render
  try {
    return (
      <div className="min-h-screen bg-white pb-24 relative animate-in slide-in-from-right duration-300">
        {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleReportSubmit}
          adTitle={ad.title || "Anúncio"}
        />

        {/* Header Image Gallery */}
        <div className="relative h-80 w-full bg-gray-900 group rounded-b-[40px] overflow-hidden shadow-lg z-10">
          <img
            src={images[currentImageIndex] || 'https://via.placeholder.com/800x600?text=Erro+Imagem'}
            alt={`${ad.title || 'Veículo'} - Foto ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Erro+Imagem'; }}
          />
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20"><ChevronRight className="w-6 h-6" /></button>
            </>
          )}
          <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <button onClick={onBack} className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 pointer-events-auto border border-white/10"><ChevronLeft className="w-6 h-6" /></button>
            <div className="flex gap-3 pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); setIsReportModalOpen(true); }} className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-red-500 hover:border-red-500 border border-white/10 transition-colors" title="Denunciar"><Flag className="w-6 h-6" /></button>
              <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`p-2 rounded-full backdrop-blur-md transition-all border ${isFavorite ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/20 border-white/10 text-white hover:bg-white/30'}`}><Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} /></button>
              <button
                onClick={(e) => { e.stopPropagation(); handleShareQR(); }}
                className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/10"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Photo Counter */}
          <div className="absolute bottom-6 right-6 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 z-20 shadow-sm pointer-events-none">
            <Camera className="w-3.5 h-3.5" />
            <span>{currentImageIndex + 1} / {images.length}</span>
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 p-2 pointer-events-none">{images.map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`} />))}</div>
          )}
        </div>

        <div className="p-6 -mt-6 relative z-20 bg-white rounded-t-[30px]">

          <div className="flex justify-center -mt-2 mb-4"><div className="w-12 h-1 bg-gray-200 rounded-full"></div></div>

          {ad.fairPresence?.active && !ad.isOwner && (
            <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 shadow-lg shadow-green-200 text-white flex items-center justify-between animate-in zoom-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative">
                  <Map className="w-6 h-6 text-white" />
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-green-500 rounded-full animate-ping"></span>
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-green-500 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none">Ao Vivo na Feira!</h3>
                  <p className="text-green-100 text-xs mt-1 font-medium">Veículo disponível para visitação agora.</p>
                </div>
              </div>
              <div className="text-right"><span className="text-[10px] font-bold bg-black/20 px-2 py-1 rounded-full">{timeLeft}</span></div>
            </div>
          )}

          {ad.isOwner && (
            <div className={`mb-6 rounded-2xl p-4 border-2 transition-all ${ad.fairPresence?.active ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-dashed border-gray-300'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Map className={`w-5 h-5 ${ad.fairPresence?.active ? 'text-green-600' : 'text-gray-400'}`} />
                  <h3 className={`font-bold ${ad.fairPresence?.active ? 'text-green-800' : 'text-gray-600'}`}>{ad.fairPresence?.active ? 'Você está na feira!' : 'Vai à feira hoje?'}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={ad.fairPresence?.active || false} onChange={onToggleFairPresence} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label>
              </div>
              <p className="text-xs text-gray-500 mb-2">{ad.fairPresence?.active ? 'Seu veículo está destacado para compradores próximos. O status desativará automaticamente em:' : 'Ative para avisar aos compradores que o veículo está disponível para visitação presencial agora. (Disponível todo domingo)'}</p>
              {ad.fairPresence?.active && (<div className="flex items-center gap-2 bg-green-100 w-fit px-3 py-1 rounded-lg"><Clock className="w-3 h-3 text-green-700" /><span className="text-xs font-bold text-green-800">{timeLeft}</span></div>)}
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">
              {truncateTitle(ad.title || "Sem título")}
            </h1>
            <span className="bg-blue-50 text-primary text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap border border-blue-100">{ad.vehicleType || "Veículo"}</span>
          </div>

          <div className="flex gap-2 flex-wrap mb-6">
            {ad.isOwner && (<span className="inline-block bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md border border-green-100">Único dono</span>)}
            {ad.ipvaPaid && (<span className="inline-block bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md border border-green-100">IPVA pago</span>)}
          </div>

          <div className="mb-8">
            <span className="text-sm text-gray-500 font-medium block mb-1">Valor à vista</span>
            <h2 className="text-4xl font-bold text-primary tracking-tight">{(ad.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h2>
          </div>

          {/* Seller Info Card (Clickable) */}
          <div
            onClick={onViewProfile}
            className="flex items-center gap-4 bg-white border border-gray-100 shadow-sm p-4 rounded-2xl mb-8 cursor-pointer hover:bg-gray-50 transition-colors group active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:border-primary transition-colors">
              {ad.ownerAvatar ? (
                <img src={ad.ownerAvatar} alt={ad.ownerName || "Vendedor"} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-7 h-7 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">
                {ad.isOwner ? "Eu (Vendedor)" : (ad.ownerName || "Vendedor")}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-xs text-gray-500">Online agora • Ver perfil</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary" />
          </div>

          {ad.isOwner && (
            <div className="mb-8 bg-blue-50/50 border border-blue-100 p-5 rounded-2xl animate-in fade-in">
              <div className="flex items-center gap-2 mb-4"><QrCode className="w-5 h-5 text-primary" /><h3 className="font-bold text-gray-900">QR Code do Anúncio</h3></div>
              <div className="flex items-center gap-6">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex-shrink-0"><img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 object-contain" /></div>
                <div className="flex flex-col gap-2 flex-1">
                  <button onClick={handleDownloadQR} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" /> Baixar</button>
                  <button onClick={handleShareQR} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"><Share2 className="w-4 h-4" /> Compartilhar</button>
                  <button onClick={handlePrintQR} className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg shadow-sm text-xs font-bold hover:bg-primary-dark transition-colors"><Printer className="w-4 h-4" /> Imprimir</button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Detalhes Técnicos</h3>
            <div className="grid grid-cols-2 gap-3">
              <SpecItem label="Ano" value={ad.year || 2024} />
              <SpecItem label="KM" value={ad.mileage !== undefined ? `${Number(ad.mileage).toLocaleString('pt-BR')} km` : 'N/A'} />
              <SpecItem label="Câmbio" value={ad.gearbox || "Manual"} />
              <SpecItem label="Combustível" value={ad.fuel || "Flex"} />
              <SpecItem label="Motor" value={ad.engine || "1.0"} />
              <SpecItem label="Final da Placa" value={ad.plate ? ad.plate.slice(-1) : "?"} />
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">Sobre este veículo</h3>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100"><p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">{ad.description || "Nenhuma descrição fornecida pelo vendedor."}</p></div>
          </div>

          {ad.additionalInfo && ad.additionalInfo.length > 0 && (
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Destaques do Vendedor</h3>
              <div className="flex flex-wrap gap-2">
                {ad.additionalInfo.map((info, idx) => (
                  <span key={idx} className="bg-green-50 text-green-700 px-3 py-2 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    {info}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">Opcionais</h3>
            <div className="flex flex-wrap gap-2">{features.map((feat, idx) => (<span key={idx} className="bg-white text-gray-600 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200">{feat}</span>))}</div>
          </div>

          <div className="mb-8 bg-blue-50 p-5 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-4">Análise de Preço</h3>
            <div className="flex justify-between items-center mb-2"><span className="text-sm text-blue-700 font-medium">Tabela FIPE</span><span className="font-bold text-blue-900">{ad.fipePrice ? ad.fipePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'}</span></div>
            {ad.fipePrice && (<><div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden"><div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, (ad.price / ad.fipePrice) * 100)}%` }}></div></div>{comparison && (<div className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-center inline-block w-full ${comparison.bg} ${comparison.color}`}>{comparison.text}</div>)}</>)}
            {!ad.fipePrice && (<p className="text-xs text-blue-600 mt-2 text-center font-medium">Dados de referência não disponíveis para este veículo.</p>)}
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">Localização</h3>
            <div className="bg-gray-100 rounded-2xl overflow-hidden h-40 relative flex items-center justify-center mb-2 border border-gray-200"><MapPin className="text-primary w-10 h-10 mb-2 drop-shadow-md" /><div className="absolute bottom-3 bg-white/95 backdrop-blur px-4 py-2 rounded-xl text-sm font-bold shadow-sm text-gray-800 border border-gray-100">{ad.location}</div></div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 px-6 flex gap-3 items-center z-50 max-w-md mx-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-[30px]">
          <button onClick={onStartChat} className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-2xl shadow-lg shadow-yellow-100 flex items-center justify-center gap-2 transition-all active:scale-95"><MessageSquare className="w-5 h-5" /><span>Chat</span></button>
          <button
            onClick={handleShareQR}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-95"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Critical rendering error in VehicleDetails:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 text-center">
        <div className="bg-red-100 text-red-600 p-4 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ops! Algo deu errado.</h2>
        <p className="text-gray-600 mb-6">Encontramos um problema ao exibir os detalhes deste veículo.</p>
        <button onClick={onBack} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50">
          Voltar para o Início
        </button>
      </div>
    );
  }
};
