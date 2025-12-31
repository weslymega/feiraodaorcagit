
import React, { useState } from 'react';
import { ChevronLeft, Heart, Share2, MapPin, MessageSquare, Phone, User as UserIcon, ChevronRight, Wrench, Tag, Package, CheckCircle, QrCode, Printer, Download, Flag } from 'lucide-react';
import { AdItem, ReportItem } from '../types';
import { ReportModal } from '../components/ReportModal';
import { Toast } from '../components/Shared';

interface PartServiceDetailsProps {
  ad: AdItem;
  onBack: () => void;
  onStartChat?: () => void;
  onViewProfile?: () => void;
  onReport?: (report: ReportItem) => void;
}

export const PartServiceDetails: React.FC<PartServiceDetailsProps> = ({ ad, onBack, onStartChat, onViewProfile, onReport }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const images = ad.images && ad.images.length > 0 ? ad.images : [ad.image];
  
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
      printWindow.document.write(`<html><body><h1>${ad.title}</h1><div class="price">${ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><img src="${qrCodeUrl}" onload="setTimeout(function(){ window.print(); window.close(); }, 500);" /></body></html>`);
      printWindow.document.close();
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: ad.title, text: `Confira este item: ${ad.title}`, url: qrData }); } catch (error) { console.log('Erro ao compartilhar', error); }
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

      <div className="relative h-72 w-full bg-gray-100 group">
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
        {images.length > 1 && (<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 p-2">{images.map((_, idx) => (<div key={idx} className={`w-2 h-2 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50'}`} />))}</div>)}
      </div>

      <div className="p-5">
        
        <div className="flex gap-2 mb-3">
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"><Wrench className="w-3 h-3" />{ad.partType || "Peças e Serviços"}</span>
          {ad.condition && (<span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${ad.condition === 'Novo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}><Package className="w-3 h-3" />{ad.condition}</span>)}
        </div>

        <h1 className="text-xl font-bold text-gray-900 leading-snug mb-2">{ad.title}</h1>
        
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-4"><MapPin className="w-4 h-4" /><span>{ad.location}</span></div>

        <div className="mb-6 pb-6 border-b border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900">{ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
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
              <p className="font-bold text-gray-900">Vendedor</p>
              <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /><p className="text-xs text-gray-500">Identidade verificada</p></div>
           </div>
           <button className="ml-auto text-primary text-sm font-bold group-hover:underline">Ver perfil</button>
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
           <h3 className="font-bold text-gray-900 mb-2">Descrição</h3>
           <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{ad.description || "Nenhuma descrição fornecida pelo vendedor."}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
           <h4 className="font-bold text-blue-900 text-sm mb-2">Dicas de Segurança</h4>
           <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside"><li>Não faça pagamentos antecipados.</li><li>Verifique o produto pessoalmente antes de comprar.</li><li>Prefira locais públicos para encontros.</li></ul>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 items-center z-50 max-w-md mx-auto">
         <button onClick={onStartChat} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full shadow flex items-center justify-center gap-2 transition-colors active:scale-95"><MessageSquare className="w-5 h-5" /> Chat</button>
         <button className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow transition-colors active:scale-95 flex-1 font-bold flex items-center justify-center gap-2"><Phone className="w-5 h-5" /> Ligar</button>
      </div>
    </div>
  );
};
