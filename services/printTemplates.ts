
import { AdItem } from '../types';
import { APP_LOGOS } from '../constants';

export const generateA4PrintTemplate = (ad: AdItem, qrCodeUrl: string) => {
    const categoryLabel = ad.category === 'veiculos' ? 'VEÍCULO' :
        ad.category === 'imoveis' ? 'IMÓVEL' : 'ITEM';

    const formattedPrice = (ad.price || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Imprimir QR Code - ${ad.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
        }

        body {
          font-family: 'Inter', sans-serif;
          background: white;
          color: #1a1a1a;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 0;
        }

        .a4-container {
          width: 210mm;
          height: 297mm;
          background: white;
          padding: 20mm;
          display: flex;
          flex-col;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #eee;
          position: relative;
          overflow: hidden;
        }

        @media print {
          body { padding: 0; }
          .a4-container { border: none; width: 100%; height: 100%; }
        }

        /* Top Branding */
        .header {
          text-align: center;
          width: 100%;
          margin-bottom: 20px;
        }

        .logo-main {
          height: 60px;
          margin-bottom: 15px;
        }

        .badge {
          background: #004AAD;
          color: white;
          padding: 12px 30px;
          border-radius: 50px;
          font-weight: 900;
          font-size: 24px;
          text-transform: uppercase;
          letter-spacing: 2px;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(0, 74, 173, 0.2);
        }

        /* Ad Title */
        .ad-info {
          text-align: center;
          margin: 30px 0;
        }

        .ad-title {
          font-size: 38px;
          font-weight: 900;
          color: #000;
          margin-bottom: 10px;
          line-height: 1.1;
        }

        .ad-price {
          font-size: 48px;
          font-weight: 900;
          color: #004AAD;
        }

        /* QR Code Section */
        .qr-section {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .qr-wrapper {
          position: relative;
          background: white;
          padding: 20px;
          border-radius: 40px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          border: 2px solid #f0f0f0;
          line-height: 0;
        }

        .qr-image {
          width: 320px;
          height: 320px;
        }

        .qr-logo-overlay {
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

        /* Call to Action */
        .cta-section {
          text-align: center;
        }

        .cta-header {
          font-size: 28px;
          font-weight: 900;
          color: #004AAD;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .cta-desc {
          font-size: 20px;
          color: #666;
          font-weight: 700;
          margin-bottom: 30px;
        }

        /* Footer */
        .footer {
          width: 100%;
          border-top: 2px solid #f0f0f0;
          padding-top: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .site-url {
          font-size: 24px;
          font-weight: 900;
          color: #004AAD;
        }

        .orca-tag {
          font-weight: 700;
          color: #999;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="a4-container">
        <div class="header">
          <img src="${APP_LOGOS.FULL}" class="logo-main" alt="Logo">
          <br>
          <div class="badge">${categoryLabel} À VENDA</div>
        </div>

        <div class="ad-info">
          <h1 class="ad-title">${ad.title}</h1>
          <div class="ad-price">${formattedPrice}</div>
        </div>

        <div class="qr-section">
          <div class="qr-wrapper">
            <img src="${qrCodeUrl}" class="qr-image" alt="QR Code">
            <div class="qr-logo-overlay">
              <img src="${APP_LOGOS.ICON}" style="width: 100%; height: 100%;" />
            </div>
          </div>
        </div>

        <div class="cta-section">
          <div class="cta-header">
            <span>📱</span> Aponte a câmera para o QR Code
          </div>
          <p class="cta-desc">Escaneie para ver fotos, valor e falar no WhatsApp agora!</p>
        </div>

        <div class="footer">
          <div class="orca-tag">Feirão da Orca - O Marketplace do DF</div>
          <div class="site-url">feiraodaorca.com</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            // window.close(); // Optional: close window after print
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;
};
