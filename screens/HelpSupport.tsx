
import React, { useState } from 'react';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { Header } from '../components/Shared';

interface HelpSupportProps {
  onBack: () => void;
}

export const HelpSupport: React.FC<HelpSupportProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">
      <Header title="Ajuda e Suporte" onBack={onBack} />

      <div className="p-6">
        
        {/* Intro Section */}
        <div className="flex flex-col items-center mb-8 text-center">
           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-primary">
              <HelpCircle className="w-8 h-8" />
           </div>
           <h2 className="text-xl font-bold text-gray-900 mb-2">Como podemos ajudar?</h2>
           <p className="text-gray-500 text-sm max-w-xs">
             Tem alguma dúvida, sugestão ou encontrou um problema? Entre em contato com a nossa equipe.
           </p>
        </div>

        {/* Contact Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Fale conosco
          </h3>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.href = "tel:+5561983227344"}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-primary/90"
            >
              <div className="bg-white/20 p-1.5 rounded-lg">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </div>
              Ligar agora
            </button>

            <button 
              onClick={() => window.open("https://wa.me/5561983227344?text=Olá,%20preciso%20de%20ajuda", "_blank")}
              className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-[#20ba5a]"
            >
              <div className="bg-white/20 p-1.5 rounded-lg">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.539 2.016 2.152-.525c.957.61 1.745.925 2.845.925 3.317 0 5.833-2.518 5.833-5.834 0-3.18-2.586-5.766-5.766-5.766-.001 0 .001 0 0 0zm3.321 8.24c-.114.33-.647.625-.892.671-.248.046-.499.076-1.597-.361-1.396-.557-2.316-1.936-2.385-2.031-.072-.094-.575-.765-.575-1.46s.362-1.042.491-1.18c.129-.138.281-.173.375-.173s.188 0 .269.006c.086.005.201-.033.314.24.114.276.39.953.424 1.022s.057.149.011.24-.069.159-.144.24-.153.188-.218.254c-.069.066-.141.138-.06.279.08.141.357.589.765.953.525.467.971.611 1.11.691.141.08.221.066.304-.029.083-.096.357-.417.451-.557s.188-.117.315-.069c.126.048.802.378.943.447s.233.102.267.159c.034.057.034.332-.08.662zM12 2C6.477 2 2 6.477 2 12c0 1.892.524 3.662 1.432 5.176L2 22l4.981-1.309A9.948 9.948 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.706 0-3.3-.435-4.69-1.203l-.337-.184-2.825.742.756-2.822-.206-.328A7.95 7.95 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
              </div>
              Falar no WhatsApp
            </button>
          </div>

          <p className="mt-8 text-sm text-gray-500 font-medium">
            Atendimento de segunda a sexta, das 08h às 18h
          </p>
        </div>



      </div>
    </div>
  );
};
