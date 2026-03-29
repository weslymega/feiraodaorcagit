
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Printer, Info, Loader2 } from 'lucide-react';
import { AdItem, Screen } from '../types';
import { APP_URL, APP_LOGOS } from '../constants';

interface PrintPreviewProps {
  ad: AdItem;
  onBack: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ ad, onBack }) => {
  const [isPreparing, setIsPreparing] = useState(false);

  const formattedPrice = (ad.price || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const categoryLabel = ad.category === 'veiculos' ? 'VEÍCULO' :
    ad.category === 'imoveis' ? 'IMÓVEL' : 'ITEM';

  // Regenerar QR Code para garantir atualidade
  const qrData = `${APP_URL}/anuncio/${ad.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}&color=004AAD&bgcolor=ffffff&margin=10&ecc=H`;

  const handlePrint = () => {
    setIsPreparing(true);
    
    // Pequeno delay para garantir que o feedback visual seja renderizado
    // e para estabilidade em WebViews Android
    setTimeout(() => {
      window.print();
      setIsPreparing(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col overflow-auto">
      {/* CSS de Impressão e Preview */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        .print-preview-container {
          font-family: 'Inter', sans-serif;
          background: #f3f4f6;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
        }

        .a4-page {
          width: 210mm;
          height: 297mm;
          background: white;
          padding: 20mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          border-radius: 4px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
          transform-origin: top center;
        }

        /* Ajuste para telas pequenas (mobile preview) */
        @media (max-width: 215mm) {
          .a4-page {
            transform: scale(calc(100vw / 230mm));
            margin-bottom: calc(-297mm * (1 - (100vw / 230mm)));
          }
        }

        .print-header {
          text-align: center;
          width: 100%;
          margin-bottom: 20px;
        }

        .print-logo-main {
          height: 60px;
          margin-bottom: 15px;
        }

        .print-badge {
          background: #004AAD;
          color: white;
          padding: 12px 30px;
          border-radius: 50px;
          font-weight: 900;
          font-size: 24px;
          text-transform: uppercase;
          letter-spacing: 2px;
          display: inline-block;
        }

        .print-ad-info {
          text-align: center;
          margin: 30px 0;
        }

        .print-ad-title {
          font-size: 38px;
          font-weight: 900;
          color: #000;
          margin-bottom: 10px;
          line-height: 1.1;
        }

        .print-ad-price {
          font-size: 48px;
          font-weight: 900;
          color: #004AAD;
        }

        .print-qr-section {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .print-qr-wrapper {
          position: relative;
          background: white;
          padding: 20px;
          border-radius: 40px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          border: 2px solid #f0f0f0;
          line-height: 0;
        }

        .print-qr-image {
          width: 320px;
          height: 320px;
        }

        .print-qr-logo-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70px;
          height: 70px;
          background: white;
          border-radius: 15px;
          padding: 8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .print-cta-section {
          text-align: center;
        }

        .print-cta-header {
          font-size: 28px;
          font-weight: 900;
          color: #004AAD;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .print-cta-desc {
          font-size: 20px;
          color: #666;
          font-weight: 700;
          margin-bottom: 30px;
        }

        .print-footer {
          width: 100%;
          border-top: 2px solid #f0f0f0;
          padding-top: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .print-site-url {
          font-size: 24px;
          font-weight: 900;
          color: #004AAD;
        }

        .print-orca-tag {
          font-weight: 700;
          color: #999;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        @media print {
          /* Esconder tudo exceto a página A4 */
          body * {
            visibility: hidden;
          }
          .a4-page, .a4-page * {
            visibility: visible;
          }
          .a4-page {
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            border: none;
            box-shadow: none;
            transform: none !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      {/* Top Navbar (Sticky) */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4 px-6 flex items-center justify-between no-print shadow-sm">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="font-bold text-gray-900">Pré-visualização</h2>
        <button
          onClick={handlePrint}
          disabled={isPreparing}
          className="bg-primary text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-70 transition-all"
        >
          {isPreparing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Printer className="w-5 h-5" />
          )}
          <span>Imprimir</span>
        </button>
      </div>

      <div className="flex-1 print-preview-container no-print">
        {/* Instructional Info Box */}
        <div className="max-w-[210mm] w-full mb-8 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top duration-500">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">Dica de Impressão</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Esta é uma simulação do papel A4 que será gerado. Ao clicar em <strong>Imprimir</strong>, as opções do seu sistema abrirão. Recomendamos salvar como PDF ou imprimir direto em uma impressora A4.
            </p>
          </div>
        </div>

        {/* Paper Simulation */}
        <div className="a4-page">
          <div className="print-header">
            <img src={APP_LOGOS.FULL} className="print-logo-main" alt="Logo" />
            <br />
            <div className="print-badge">{categoryLabel} À VENDA</div>
          </div>

          <div className="print-ad-info">
            <h1 className="print-ad-title">{ad.title}</h1>
            <div className="print-ad-price">{formattedPrice}</div>
          </div>

          <div className="print-qr-section">
            <div className="print-qr-wrapper">
              <img src={qrCodeUrl} className="print-qr-image" alt="QR Code" />
              <div className="print-qr-logo-overlay">
                <img src={APP_LOGOS.ICON} style={{ width: '100%', height: '100%' }} />
              </div>
            </div>
          </div>

          <div className="print-cta-section">
            <div className="print-cta-header">
              <span>📱</span> Aponte a câmera para o QR Code
            </div>
            <p className="print-cta-desc">Escaneie para ver fotos, valor e falar no WhatsApp agora!</p>
          </div>

          <div className="print-footer">
            <div className="print-orca-tag">Feirão da Orca - O Marketplace do DF</div>
            <div className="print-site-url">feiraodaorca.com</div>
          </div>
        </div>

        {/* Bottom Banner for Mobile */}
        <div className="max-w-[210mm] w-full mt-12 p-8 text-center text-gray-400 text-xs font-medium uppercase tracking-widest no-print">
          Fim da visualização
        </div>
      </div>

      {/* Loading Overlay for Print Prep */}
      {isPreparing && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 no-print">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-white/20">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="font-bold text-gray-900">Abrindo as opções de impressão...</p>
            <p className="text-xs text-gray-500">Pode demorar alguns segundos.</p>
          </div>
        </div>
      )}
    </div>
  );
};
