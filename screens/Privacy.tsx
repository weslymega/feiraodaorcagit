
import React, { useState } from 'react';
import { Eye, EyeOff, Users, MessageCircle, Ban, ChevronRight, FileText } from 'lucide-react';
import { Header } from '../components/Shared';

interface PrivacyProps {
  onBack: () => void;
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

export const Privacy: React.FC<PrivacyProps> = ({ onBack }) => {
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowSearchByEmail, setAllowSearchByEmail] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300">
      <Header title="Privacidade" onBack={onBack} />

      <div className="p-4 space-y-6">
        
        {/* Visibilidade */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Visibilidade</h3>
          
          <ToggleRow 
            icon={isProfilePublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            label="Perfil Público"
            description="Permitir que pessoas que não estão na sua lista vejam seus anúncios."
            checked={isProfilePublic}
            onChange={() => setIsProfilePublic(!isProfilePublic)}
          />

          <ToggleRow 
            icon={<div className="w-5 h-5 flex items-center justify-center"><div className="w-3 h-3 bg-green-500 rounded-full"></div></div>}
            label="Mostrar Status Online"
            description="Exibir quando você estiver ativo no aplicativo."
            checked={showOnlineStatus}
            onChange={() => setShowOnlineStatus(!showOnlineStatus)}
          />
        </div>

        {/* Interações */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interações</h3>

          <ToggleRow 
            icon={<Users className="w-5 h-5" />}
            label="Encontrar por E-mail"
            description="Permitir que pessoas encontrem seu perfil usando seu e-mail."
            checked={allowSearchByEmail}
            onChange={() => setAllowSearchByEmail(!allowSearchByEmail)}
          />

          <ToggleRow 
            icon={<MessageCircle className="w-5 h-5" />}
            label="Confirmação de Leitura"
            description="Mostrar quando você visualizou mensagens no chat."
            checked={readReceipts}
            onChange={() => setReadReceipts(!readReceipts)}
          />
        </div>

        {/* Outros */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-4">
              <Ban className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">Usuários Bloqueados</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">3 usuários</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">Política de Privacidade</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 px-4">
          Nós levamos sua privacidade a sério. Seus dados pessoais nunca são compartilhados sem sua permissão explícita.
        </p>

      </div>
    </div>
  );
};
