import React, { useState } from 'react';
import { Shield, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { APP_LOGOS, BASE_URL } from '../constants';
import { Screen } from '../types';
import { openExternalLink } from '../utils/openExternalLink';
import { LINKS } from '../utils/links';

interface AcceptTermsScreenProps {
  onAccept: () => Promise<void>;
  onLogout: () => void;
}

export const AcceptTermsScreen: React.FC<AcceptTermsScreenProps> = ({ onAccept, onLogout }) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!accepted || loading) return;
    setLoading(true);
    try {
      await onAccept();
    } catch (error) {
      console.error("Erro ao aceitar termos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      {/* Header com Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <img src={APP_LOGOS.ICON} alt="Orca Logo" className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Quase lá!</h1>
        <p className="text-slate-500 mt-2">Para continuar, precisamos da sua confirmação.</p>
      </div>

      {/* Card de Aceite */}
      <div className="w-full max-w-sm bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6 text-blue-600 bg-blue-50/50 p-4 rounded-2xl">
          <Shield className="w-6 h-6 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-blue-900">
            O Feirão da Orca valoriza sua privacidade. Ao continuar, você concorda com nossas diretrizes de uso e proteção de dados.
          </p>
        </div>

        <button 
          onClick={() => setAccepted(!accepted)}
          className="flex items-start gap-3 w-full text-left group"
        >
          <div className={`mt-0.5 min-w-[22px] h-[22px] rounded-lg border-2 flex items-center justify-center transition-all ${
            accepted 
              ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200' 
              : 'bg-white border-slate-300 group-hover:border-blue-400'
          }`}>
            {accepted && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
          </div>
          <span className="text-sm text-slate-700 leading-snug">
            Li e aceito os <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); openExternalLink(LINKS.TERMS); }} className="text-blue-600 font-semibold cursor-pointer hover:underline inline-flex items-center gap-1">Termos de Uso <ExternalLink className="w-3 h-3" /></span> e a <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); openExternalLink(LINKS.PRIVACY); }} className="text-blue-600 font-semibold cursor-pointer hover:underline inline-flex items-center gap-1">Política de Privacidade <ExternalLink className="w-3 h-3" /></span>.
          </span>
        </button>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleContinue}
            disabled={!accepted || loading}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              accepted && !loading
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Confirmar e Entrar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={onLogout}
            className="w-full py-3 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center max-w-[240px]">
        O acesso ao marketplace é restrito a usuários que concordam com as regras da plataforma.
      </p>
    </div>
  );
};
