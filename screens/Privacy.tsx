
import React from 'react';
import { Eye, MessageCircle, UserX, ChevronRight } from 'lucide-react';
import { Header } from '../components/Shared';
import { User, Screen } from '../types';

interface PrivacyProps {
  user: User;
  onBack: () => void;
  onUpdateSettings: (settings: { showOnlineStatus?: boolean, readReceipts?: boolean }) => void;
  onNavigate: (screen: any) => void;
}

const ToggleRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  readOnly?: boolean;
}> = ({ icon, label, description, checked, onChange, readOnly }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
    <div className="flex items-start gap-4 pr-4">
      <div className="text-gray-500 mt-0.5">{icon}</div>
      <div>
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
    {!readOnly ? (
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-primary' : 'bg-gray-300'
          }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'left-7' : 'left-1'
            }`}
        />
      </button>
    ) : (
      <div className="text-xs font-bold text-primary px-2 py-1 bg-green-50 rounded-lg">ATIVO</div>
    )}
  </div>
);

export const Privacy: React.FC<PrivacyProps> = ({ user, onBack, onUpdateSettings, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300">
      <Header title="Privacidade" onBack={onBack} />

      <div className="p-4 space-y-6">

        {/* Visibilidade */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Visibilidade</h3>

          <ToggleRow
            icon={<Eye className="w-5 h-5" />}
            label="Perfil Público"
            description="Seu perfil e anúncios estão visíveis para todos os usuários."
            checked={true}
            onChange={() => { }}
            readOnly
          />

          <ToggleRow
            icon={<div className="w-5 h-5 flex items-center justify-center"><div className="w-3 h-3 bg-green-500 rounded-full"></div></div>}
            label="Mostrar Status Online"
            description="Exibir quando você estiver ativo no aplicativo."
            checked={!!user.showOnlineStatus}
            onChange={() => onUpdateSettings({ showOnlineStatus: !user.showOnlineStatus })}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider p-4 pb-2">Segurança e Bloqueios</h3>
          
          <button 
            onClick={() => onNavigate(Screen.BLOCKED_USERS)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-4">
              <UserX className="w-5 h-5 text-red-500" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Usuários Bloqueados</h4>
                <p className="text-xs text-gray-500">Gerencie quem você bloqueou no app</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 px-4">
          Nós levamos sua privacidade a sério. Suas configurações são salvas instantaneamente e protegem sua experiência no Feirão da Orca.
        </p>

      </div>
    </div>
  );
};
