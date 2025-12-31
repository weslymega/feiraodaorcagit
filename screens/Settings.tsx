
import React from 'react';
import { User, Bell, Shield, Lock, HelpCircle, Info, ChevronRight, ShieldCheck } from 'lucide-react';
import { Header } from '../components/Shared';
import { Screen, User as UserType } from '../types';

interface SettingsProps {
  user: UserType;
  onBack: () => void;
  onLogout: () => void;
  onNavigate: (screen: Screen) => void;
}

const SettingsItem: React.FC<{ icon: React.ReactNode, label: string, onClick?: () => void, accent?: boolean }> = ({ icon, label, onClick, accent }) => (
  <button onClick={onClick} className="w-full bg-white p-4 flex items-center justify-between border-b border-gray-100 last:border-0 hover:bg-gray-50">
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${accent ? 'bg-primary text-white' : 'bg-green-50 text-gray-800'}`}>
        {icon}
      </div>
      <span className={`font-medium ${accent ? 'text-primary font-bold' : 'text-gray-700'}`}>{label}</span>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-400" />
  </button>
);

export const Settings: React.FC<SettingsProps> = ({ user, onBack, onLogout, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <Header title="Configurações" onBack={onBack} />

      <div className="p-4 flex flex-col gap-6">
        
        {/* Área Administrativa (Só aparece se for Admin) */}
        {user.isAdmin && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-primary/20">
             <SettingsItem 
               icon={<ShieldCheck className="w-5 h-5" />} 
               label="Painel Administrativo" 
               onClick={() => onNavigate(Screen.ADMIN_PANEL)}
               accent
             />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SettingsItem 
            icon={<User className="w-5 h-5" />} 
            label="Dados da Conta" 
            onClick={() => onNavigate(Screen.ACCOUNT_DATA)}
          />
          <SettingsItem 
            icon={<Bell className="w-5 h-5" />} 
            label="Notificações" 
            onClick={() => onNavigate(Screen.NOTIFICATIONS)}
          />
          <SettingsItem 
            icon={<Shield className="w-5 h-5" />} 
            label="Privacidade" 
            onClick={() => onNavigate(Screen.PRIVACY)}
          />
          <SettingsItem 
            icon={<Lock className="w-5 h-5" />} 
            label="Segurança" 
            onClick={() => onNavigate(Screen.SECURITY)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SettingsItem 
            icon={<HelpCircle className="w-5 h-5" />} 
            label="Ajuda e Suporte" 
            onClick={() => onNavigate(Screen.HELP_SUPPORT)}
          />
          <SettingsItem 
            icon={<Info className="w-5 h-5" />} 
            label="Sobre o Aplicativo" 
            onClick={() => onNavigate(Screen.ABOUT_APP)}
          />
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-white text-red-500 font-medium p-4 rounded-xl shadow-sm hover:bg-red-50 transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  );
};
