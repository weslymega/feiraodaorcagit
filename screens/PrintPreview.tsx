
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Printer, Info, Loader2, Download, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AdItem } from '../types';
import { APP_URL, APP_LOGOS } from '../constants';
import { Capacitor } from '@capacitor/core';
import { downloadQR } from '../utils/mobileActions';

interface PrintPreviewProps {
  ad: AdItem;
  onBack: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ ad, onBack }) => {
  const [isPreparing, setIsPreparing] = useState(false);
  const [showAndroidFallback, setShowAndroidFallback] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const isNative = Capacitor.isNativePlatform();

  const formattedPrice = (ad.price || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const categoryLabel = ad.category === 'veiculos' ? 'VEÍCULO' :
    ad.category === 'imoveis' ? 'IMÓVEL' : 'ITEM';

  const qrData = `${APP_URL}/anuncio/${ad.id}`;

  const handlePrint = () => {
    if (isNative) {
      setShowAndroidFallback(true);
      return;
    }

    setIsPreparing(true);
    
    // Pequeno delay para o feedback visual aparecer
    setTimeout(() => {
      setIsPreparing(false); // Remove overlay ANTES para não travar a UI
      
      // RequestAnimationFrame garante que o navegador renderizou a remoção do overlay
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            window.print();
          } catch (error) {
            console.error("Print error:", error);
            setShowAndroidFallback(true);
          }
        }, 100);
      });
    }, 600);
  };

  const handleSaveImage = () => {
    // Usar a utilidade existente para baixar o QR
    // Como queremos o anúncio inteiro em imagem no futuro, por enquanto garantimos o QR funcional
    const qrSvg = document.querySelector('.print-qr-wrapper svg');
    if (qrSvg) {
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        downloadQR(pngUrl, `anuncio-${ad.id}.png`);
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col overflow-auto print-root-container">
      {/* CSS de Impressão e Preview - TOTALMENTE REFATORADO */}
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
          box-sizing: border-box;
        }

        /* Ajuste para telas pequenas (mobile preview) */
        @media (max-width: 215mm) {
          .a4-page {
            transform: scale(calc(100vw / 235mm));
            transform-origin: top center;
            margin-bottom: calc(-297mm * (1 - (100vw / 235mm)));
          }
        }

        .print-header { text-align: center; width: 100%; margin-bottom: 20px; }
        .print-logo-main { height: 65px; margin-bottom: 20px; object-fit: contain; }
        .print-badge { background: #004AAD; color: white; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 26px; text-transform: uppercase; display: inline-block; }
        .print-ad-info { text-align: center; margin: 40px 0; }
        .print-ad-title { font-size: 42px; font-weight: 900; color: #000; margin-bottom: 12px; line-height: 1.1; }
        .print-ad-price { font-size: 54px; font-weight: 900; color: #004AAD; letter-spacing: -1px; }
        .print-qr-section { display: flex; flex-direction: column; align-items: center; gap: 25px; }
        .print-qr-wrapper { position: relative; background: white; padding: 25px; border-radius: 45px; box-shadow: 0 12px 45px rgba(0,0,0,0.06); border: 2.5px solid #f2f2f2; }
        .print-qr-logo-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 75px; height: 75px; background: white; border-radius: 18px; padding: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.12); }
        .print-cta-section { text-align: center; }
        .print-cta-header { font-size: 30px; font-weight: 900; color: #004AAD; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 15px; }
        .print-cta-desc { font-size: 22px; color: #555; font-weight: 700; max-width: 80%; margin: 0 auto; }
        .print-footer { width: 100%; border-top: 3px solid #f2f2f2; padding-top: 35px; display: flex; justify-content: space-between; align-items: center; }
        .print-site-url { font-size: 26px; font-weight: 900; color: #004AAD; }
        .print-orca-tag { font-weight: 700; color: #aaa; font-size: 16px; text-transform: uppercase; letter-spacing: 1.5px; }

        /* REGRAS DE IMPRESSÃO - CRÍTICO */
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }

          /* Reset de Containers Pai (evita cortes laterais) */
          #root, #app-main-container {
            max-width: none !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          /* Oculta o rodapé estático do index.html e elementos UI do app */
          footer, .no-print, .sticky, button, .blue-info-box {
            display: none !important;
          }

          .print-preview-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            display: block !important;
          }

          .no-print, .sticky, button, .blue-info-box {
            display: none !important;
          }

          .a4-page {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      ` }} />

      {/* Top Navbar (Persistent) */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4 px-6 flex items-center justify-between no-print shadow-sm">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="font-bold text-gray-900">Imprimir Anúncio</h2>
        <div className="flex gap-2">
          {isNative && (
            <button
              onClick={handleSaveImage}
              className="bg-emerald-500 text-white p-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95"
              title="Salvar Imagem"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={isPreparing}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-70 transition-all"
          >
            {isPreparing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
            <span>{isNative ? 'Imprimir' : 'Imprimir'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 print-preview-container">
        {/* Info Box */}
        <div className="max-w-[210mm] w-full mb-8 bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-start gap-4 no-print blue-info-box">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900">Geração de QR Code Offline</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              O QR Code foi gerado localmente para garantir máxima qualidade. No mobile, se a janela de impressão não abrir, use o botão verde para salvar a imagem.
            </p>
          </div>
        </div>

        {/* Fallback Warning for Android */}
        {showAndroidFallback && (
          <div className="max-w-[210mm] w-full mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between no-print animate-in bounce-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-bold text-amber-900">Impressão direta indisponível no Android.</p>
            </div>
            <button 
              onClick={handleSaveImage}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Salvar Imagem para Imprimir
            </button>
          </div>
        )}

        {/* Paper Simulation */}
        <div className="a4-page" ref={printAreaRef}>
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
              <QRCodeSVG 
                value={qrData} 
                size={340} 
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: APP_LOGOS.ICON,
                  x: undefined,
                  y: undefined,
                  height: 70,
                  width: 70,
                  excavate: true,
                }}
              />
            </div>
          </div>

          <div className="print-cta-section">
            <div className="print-cta-header">
              <span>📱</span> Aponte a câmera para o QR Code
            </div>
            <p className="print-cta-desc">Escaneie para ver todas as fotos, vídeo, valor e falar no WhatsApp agora!</p>
          </div>

          <div className="print-footer">
            <div className="print-orca-tag">Feirão da Orca - O Marketplace do DF</div>
            <div className="print-site-url">feiraodaorca.com</div>
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-20 no-print"></div>
      </div>

      {/* Loading Overlay */}
      {isPreparing && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center no-print">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-bold text-gray-900">Preparando página...</p>
          </div>
        </div>
      )}
    </div>
  );
};
