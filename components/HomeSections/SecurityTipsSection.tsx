
import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

const TIPS = [
  { title: "Golpe do “intermediário”", text: "Alguém se passa por vendedor ou comprador e tenta enganar as duas partes." },
  { title: "Golpe do “sinal antecipado”", text: "Pedem um valor para “segurar” o veículo e depois somem." },
  { title: "Golpe do preço muito baixo", text: "Anúncios com valores irreais para atrair vítimas rapidamente." },
  { title: "Golpe do falso comprovante", text: "Enviam comprovante de pagamento falso antes da compensação real." },
  { title: "Golpe do link externo", text: "Enviam links falsos para pagamento ou “verificação”." },
  { title: "Atenção!", text: "Nenhum funcionário do \"Feirão da orca\" liga pedindo dados ou confirmação de anúncios!", isWarning: true }
];

export const SecurityTipsSection: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % TIPS.length);
        setIsAnimating(false);
      }, 500);
    }, 6000); // 6 segundos para dar tempo de ler confortavelmente
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-5 mb-8">
      <div className="bg-gradient-to-br from-amber-50/80 to-white border border-amber-100 rounded-[2rem] p-5 shadow-sm relative overflow-hidden h-[155px] flex flex-col justify-between">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/10 p-1.5 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <h2 className="font-black text-amber-800 text-[10px] uppercase tracking-[0.2em]">Dicas de Segurança</h2>
        </div>

        {/* Conteúdo com Transição */}
        <div className={`transition-all duration-500 transform ${isAnimating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
          <h3 className={`font-bold text-base leading-tight mb-1 flex items-center gap-1.5 ${TIPS[current].isWarning ? 'text-red-600' : 'text-gray-900'}`}>
            <span role="img" aria-label="warning">⚠️</span> {TIPS[current].title}
          </h3>
          <p className="text-[12px] text-gray-500 leading-snug font-medium line-clamp-2">
            {TIPS[current].text}
          </p>
        </div>

        {/* Indicadores e Controle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {TIPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-300 ${idx === current ? 'w-4 bg-amber-500' : 'w-1 bg-amber-200'}`}
              />
            ))}
          </div>
          <span className="text-[9px] font-black text-amber-900/30 uppercase tracking-widest">
            {current + 1} / {TIPS.length}
          </span>
        </div>

        {/* Decorativo de fundo */}
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
          <ShieldAlert className="w-24 h-24 text-amber-900" />
        </div>
      </div>
    </div>
  );
};
