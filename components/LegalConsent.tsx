import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface LegalConsentProps {
  onCheckedChange: (checked: boolean) => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
  required?: boolean;
  initialValue?: boolean;
}

export const LegalConsent: React.FC<LegalConsentProps> = ({ 
  onCheckedChange, 
  onViewTerms, 
  onViewPrivacy, 
  required = true,
  initialValue = false
}) => {
  const [checked, setChecked] = useState(initialValue);
  
  const handleToggle = () => {
    const nextValue = !checked;
    setChecked(nextValue);
    onCheckedChange(nextValue);
  };

  return (
    <div 
      className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 transition-all"
    >
      {/* Alvo de clique específico apenas no checkbox para evitar toggle acidental no container */}
      <div 
        onClick={handleToggle}
        className={`mt-0.5 min-w-[24px] h-[24px] rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 ${
          checked ? 'bg-primary border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-black/20 border-white/30 hover:border-white/50'
        }`}
        aria-checked={checked}
        role="checkbox"
      >
        {checked && <Check className="w-4 h-4 text-white animate-in zoom-in duration-300" />}
      </div>

      <div className="flex-1">
        <p className="text-white/80 text-[13.5px] leading-relaxed select-none font-medium">
          Li e aceito os{' '}
          <button 
            type="button"
            onClick={onViewTerms}
            className="text-accent font-bold hover:text-accent/80 transition-colors underline decoration-accent/30 underline-offset-4"
          >
            Termos de Uso
          </button>
          {' '}e a{' '}
          <button 
            type="button"
            onClick={onViewPrivacy}
            className="text-accent font-bold hover:text-accent/80 transition-colors underline decoration-accent/30 underline-offset-4"
          >
            Política de Privacidade
          </button>.
        </p>
        
        {required && !checked && (
          <p className="text-red-400 text-[11px] mt-1.5 animate-in fade-in slide-in-from-left-1 font-medium">
            Campo obrigatório para continuar
          </p>
        )}
      </div>
    </div>
  );
};
