
import React from 'react';
import { Heart } from 'lucide-react';
import { Header } from '../components/Shared';
import { APP_LOGOS } from '../constants';

interface AboutAppProps {
  onBack: () => void;
}

export const AboutApp: React.FC<AboutAppProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">
      <Header title="Sobre o Aplicativo" onBack={onBack} />

      <div className="p-6 flex flex-col items-center">
        
        {/* Logo / Icon Area */}
        <div className="w-32 h-32 bg-white rounded-[30px] shadow-lg border border-gray-100 flex items-center justify-center mb-6 mt-8 overflow-hidden relative">
          {/* Logo Quadrada */}
          <img 
            src={APP_LOGOS.ICON} 
            alt="Logo" 
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-2xl font-bold text-primary mb-1">Feirão da Orca</h2>
        <p className="text-sm text-gray-400 font-medium mb-8 bg-gray-200 px-3 py-1 rounded-full">v1.0.0 (Beta)</p>

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
        <div className="mt-auto flex flex-col items-center gap-2 text-gray-400 pt-8">
            <p className="text-xs font-medium">Feito em Brasília para Brasília</p>
            <div className="flex gap-1">
              <Heart className="w-4 h-4 text-primary fill-current" />
              <Heart className="w-4 h-4 text-accent fill-current" />
            </div>
            <p className="text-[10px] mt-4">© 2024 Feirão da Orca. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};
