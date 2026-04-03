
import React from 'react';
import { Heart } from 'lucide-react';
import { Header } from '../components/Shared';
import { APP_LOGOS } from '../constants';

interface AboutAppProps {
  onBack: () => void;
}

export const AboutApp: React.FC<AboutAppProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-32 animate-in slide-in-from-right duration-300">
      <Header title="Sobre o Aplicativo" onBack={onBack} />

      <div className="p-6 flex flex-col items-center">
        
        {/* Logo / Illustration Area */}
        <div className="w-64 h-64 mb-4 mt-4 overflow-hidden relative group">
          <img 
            src={APP_LOGOS.ABOUT} 
            alt="Feirão da Orca Illustration" 
            className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <p className="text-sm text-gray-400 font-medium mb-8 bg-gray-200 px-3 py-1 rounded-full">v1.0.0</p>

        {/* Main Content Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full mb-6">
          <p className="text-gray-600 leading-relaxed text-center text-base">
            O <strong className="text-primary">Feirão da Orca</strong> é a solução definitiva para o comércio no Distrito Federal.
            <br /><br />
            Conectamos compradores e vendedores com a segurança e a agilidade que Brasília merece.
            <br /><br />
            Valorizamos nossa identidade local, trazendo tecnologia de ponta com a cara da nossa capital.
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-auto flex flex-col items-center gap-2 text-gray-400 pt-8 text-center">
            <p className="text-xs font-medium">Feito em Brasília para Brasília</p>
            <div className="flex gap-1 justify-center">
              <Heart className="w-4 h-4 text-primary fill-current" />
              <Heart className="w-4 h-4 text-accent fill-current" />
            </div>
            
            <div className="mt-6 px-8">
              <p className="text-[10px] leading-tight uppercase tracking-widest font-bold">
                FEIRÃO DA ORCA é uma marca registrada no INPI
              </p>
              <p className="text-[9px] mt-1 opacity-70">
                (Instituto Nacional da Propriedade Industrial)
              </p>
            </div>

            <p className="text-[10px] mt-6 mb-8 opacity-50">© 2026 Feirão da Orca. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};
