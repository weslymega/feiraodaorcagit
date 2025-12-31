
import React, { useState } from 'react';
import { ChevronLeft, Heart, Share2, MapPin, MessageSquare, User as UserIcon, ChevronRight, Bed, Bath, Maximize, Car, QrCode, Printer, Download, Home, Camera, Flag } from 'lucide-react';
import { AdItem, ReportItem } from '../types';
import { ReportModal } from '../components/ReportModal';
import { Toast } from '../components/Shared';

interface RealEstateDetailsProps {
  ad: AdItem;
  onBack: () => void;
  onStartChat?: () => void;
  onViewProfile?: () => void;
  onReport?: (report: ReportItem) => void;
}

const SpecItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100">
    <div className="text-gray-600 mb-1">{icon}</div>
    <span className="text-gray-900 font-bold text-lg">{value}</span>
    <span className="text-gray-400 text-xs">{label}</span>
  </div>
);

export const RealEstateDetails: React.FC<RealEstateDetailsProps> = ({ ad, onBack, onStartChat, onViewProfile, onReport }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const images = ad.images && ad.images.length > 0 ? ad.images : [ad.image];
  const features = ad.features || [];
  
  const qrData = `https://feiraodaorca.app/ad/${ad.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=004AAD&bgcolor=ffffff&margin=10`;

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${ad.title.replace(/\s+/g, '-').toLowerCase()}.png`;
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
      printWindow.document.write(`<html><body><h1>${ad.title}</h1><img src="${qrCodeUrl}" onload="setTimeout(function(){ window.print(); window.close(); }, 500);" /></body></html>`);
      printWindow.document.close();
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: ad.title, text: `Confira este imóvel: ${ad.title}`, url: qrData }); } catch (error) { console.log('Erro ao compartilhar', error); }
    } else { alert("Compartilhamento não suportado neste dispositivo."); }
  };

  const handleReportSubmit = (reason: string, description: string) => {
    if (onReport) {
        const newReport: ReportItem = {
            id: `rep_${Date.now()}`,
            targetType: 'ad',
            targetName: ad.title,
            targetImage: ad.image,
            targetId: ad.id,
            reason: reason,
            description: description,
            reporterName: 'Usuário (Você)',
            date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}),
            severity: reason.includes('Golpe') || reason.includes('Impróprio') ? 'high' : 'medium',
            status: 'pending'
        };
        onReport(newReport);
        setToastMessage("Denúncia enviada para análise.");
    } else {
        console.log('Report submitted:', { adId: ad.id, reason, description });
        setToastMessage("Denúncia enviada com sucesso.");
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 relative animate-in slide-in-from-right duration-300">
      {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}
      
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onSubmit={handleReportSubmit}
        adTitle={ad.title}
      />

      <div className="relative h-72 w-full bg-gray-900 group">
        <img src={images[currentImageIndex]} alt={`${ad.title} - Foto ${currentImageIndex + 1}`} className="w-full h-full object-cover transition-opacity duration-300" />
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-100 hover:bg-black/50"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-100 hover:bg-black/50"><ChevronRight className="w-6 h-6" /></button>
          </>
        )}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
          <button onClick={onBack} className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 pointer-events-auto"><ChevronLeft className="w-6 h-6" /></button>
          <div className="flex gap-3 pointer-events-auto">
             <button onClick={(e) => { e.stopPropagation(); setIsReportModalOpen(true); }} className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-red-500 hover:border-red-500 transition-colors" title="Denunciar"><Flag className="w-6 h-6" /></button>
             <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"><Heart className="w-6 h-6" /></button>
             <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"><Share2 className="w-6 h-6" /></button>
          </div>
        </div>
        {images.length > 1 && (<div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5 p-2 pointer-events-none">{images.map((_, idx) => (<div key={idx} className={`w-2 h-2 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50'}`} />))}</div>)}
        
        {/* Photo Counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 shadow-sm pointer-events-none">
          <Camera className="w-3.5 h-3.5" />
          <span>{currentImageIndex + 1} / {images.length}</span>
        </div>
      </div>

      <div className="p-5">
        
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-xl font-bold text-gray-900 leading-snug flex-1 mr-2">{ad.title}</h1>
          <span className="bg-purple-100 text-primary text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap">{ad.realEstateType || "Imóvel"}</span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4" />
          <span>{ad.location}</span>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900">{ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-8">
           <SpecItem icon={<Maximize className="w-6 h-6" />} label="Área" value={ad.area ? `${ad.area}m²` : '--'} />
           {ad.builtArea && ad.builtArea > 0 && (<SpecItem icon={<Home className="w-6 h-6" />} label="Área Const." value={`${ad.builtArea}m²`} />)}
           <SpecItem icon={<Bed className="w-6 h-6" />} label="Quartos" value={ad.bedrooms || '--'} />
           <SpecItem icon={<Bath className="w-6 h-6" />} label="Banheiros" value={ad.bathrooms || '--'} />
           <SpecItem icon={<Car className="w-6 h-6" />} label="Vagas" value={ad.parking || '--'} />
        </div>

        {/* Seller Info (Clickable) */}
        <div 
          onClick={onViewProfile}
          className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl mb-6 cursor-pointer hover:bg-gray-100 transition-colors group active:scale-[0.98]"
        >
           <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
              <UserIcon className="w-6 h-6 text-gray-400" />
           </div>
           <div className="flex-1">
              <p className="font-bold text-gray-900 group-hover:text-primary">Anunciante</p>
              <p className="text-xs text-gray-500">Ver perfil completo</p>
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
           <h3 className="font-bold text-gray-900 mb-2">Descrição do Imóvel</h3>
           <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{ad.description || "Nenhuma descrição fornecida pelo anunciante."}</p>
        </div>

        <div className="mb-8">
           <h3 className="font-bold text-gray-900 mb-3">Características</h3>
           <div className="flex flex-wrap gap-2">
              {features.length > 0 ? (features.map((feat, idx) => (<span key={idx} className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 shadow-sm flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{feat}</span>))) : (<span className="text-gray-400 text-sm italic">Nenhuma característica informada.</span>)}
           </div>
        </div>
        
        {ad.additionalInfo && ad.additionalInfo.length > 0 && (
          <div className="mb-8"><h3 className="font-bold text-gray-900 mb-3">Detalhes Adicionais</h3><div className="flex flex-wrap gap-2">{ad.additionalInfo.map((info, idx) => (<span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{info}</span>))}</div></div>
        )}

        <div className="mb-4">
           <h3 className="font-bold text-gray-900 mb-2">Localização Aproximada</h3>
           <div className="bg-gray-100 rounded-xl overflow-hidden h-48 relative flex items-center justify-center mb-2 border border-gray-200"><MapPin className="text-gray-400 w-10 h-10 mb-2" /><div className="absolute bottom-4 bg-white/90 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm text-gray-800 flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" />{ad.location}</div></div>
           <p className="text-gray-400 text-xs text-center">A localização exata é fornecida após o contato.</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 px-6 flex gap-3 items-center z-50 max-w-md mx-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-[30px]">
         <button onClick={onStartChat} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2 transition-all active:scale-95"><MessageSquare className="w-5 h-5" /> <span>Chat</span></button>
      </div>
    </div>
  );
};
