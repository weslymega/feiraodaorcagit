
import React, { useState } from 'react';
import { Lock, Smartphone, ShieldAlert, Key, ChevronRight, AlertTriangle, Trash2 } from 'lucide-react';
import { Header } from '../components/Shared';

interface SecurityProps {
  onBack: () => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
}

const ToggleRow: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  description?: string;
  checked: boolean;
  onChange: () => void;
}> = ({ icon, label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
    <div className="flex items-start gap-4 pr-4">
      <div className="text-gray-500 mt-0.5">{icon}</div>
      <div>
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <button 
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
        checked ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <div 
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'left-7' : 'left-1'
        }`} 
      />
    </button>
  </div>
);

export const Security: React.FC<SecurityProps> = ({ onBack, onChangePassword, onDeleteAccount }) => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometrics, setBiometrics] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300">
      <Header title="Segurança" onBack={onBack} />

      <div className="p-4 space-y-6">
        
        {/* Acesso */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider p-4 pb-2">Acesso e Senha</h3>
          
          <button 
            onClick={onChangePassword}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <Key className="w-5 h-5 text-primary" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Alterar Senha</h4>
                <p className="text-xs text-gray-500">Atualize sua senha periodicamente</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <div className="px-4">
            <ToggleRow 
              icon={<ShieldAlert className="w-5 h-5" />}
              label="Autenticação em Dois Fatores"
              description="Adicione uma camada extra de segurança via SMS ou E-mail."
              checked={twoFactor}
              onChange={() => setTwoFactor(!twoFactor)}
            />

            <ToggleRow 
              icon={<Smartphone className="w-5 h-5" />}
              label="Face ID / Biometria"
              description="Usar biometria para entrar no aplicativo."
              checked={biometrics}
              onChange={() => setBiometrics(!biometrics)}
            />
          </div>
        </div>

        {/* Atividade */}
        <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Dispositivos Ativos</h3>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">iPhone 13 Pro</p>
                        <p className="text-xs text-green-600 font-medium">Este dispositivo • São Paulo, BR</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Zona de Perigo */}
        <div className="pt-6">
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-white border border-red-100 text-red-500 p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
          >
            <Trash2 className="w-5 h-5" />
            <span className="font-bold">Excluir minha conta</span>
          </button>
          <p className="text-center text-xs text-gray-400 mt-2 px-6">
            Ao excluir sua conta, todos os seus dados, anúncios e histórico serão removidos permanentemente.
          </p>
        </div>
      </div>

      {/* Modal de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Tem certeza?</h3>
            <p className="text-gray-500 text-center mb-6 text-sm leading-relaxed">
              Essa ação é <strong>irreversível</strong>. Você perderá acesso a todos os seus anúncios, mensagens e favoritos.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onDeleteAccount} 
                className="w-full py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
              >
                Sim, Excluir Minha Conta
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="w-full py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
