
import React from 'react';
import { Heart, Tag, History, Settings, MapPin, ShieldCheck, User, Wrench } from 'lucide-react';
import { Screen, User as UserType } from '../types';
import { CardButton } from '../components/Shared';
import { APP_LOGOS } from '../constants';

interface UserPanelProps {
  user: UserType;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onToggleRole: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, onNavigate, onLogout, onToggleRole }) => {
  return (
    <div className="min-h-screen bg-concrete-50 pb-24 animate-in slide-in-from-right duration-300">

      {/* Header Curvo Estilo Brasília */}
      <div className="bg-primary text-white pt-10 pb-16 px-6 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-athos-pattern opacity-10"></div>

        {/* Marca d'água da Logo (Imagem Icone) */}
        <div className="absolute -right-10 -top-10 w-64 h-64 opacity-20 pointer-events-none rotate-12 mix-blend-overlay">
          <img
            src={APP_LOGOS.ICON}
            alt="Watermark"
            className="w-full h-full object-contain brightness-0 invert"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>

        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium">Brasília, DF</span>
          </div>
          <button onClick={onLogout} className="bg-white/10 backdrop-blur-md hover:bg-white/20 px-3 py-1 rounded-full text-xs font-bold transition-colors border border-white/20">
            Sair
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full p-1 bg-white/20 backdrop-blur-sm mb-3 shadow-lg relative">
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full border-2 border-white" />
            {user.isAdmin && (
              <div className="absolute -bottom-2 bg-accent text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white">
                ADMIN
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{user.name}</h2>
          <p className="text-blue-200 text-sm font-light mb-4">{user.email}</p>

          <button
            onClick={() => onNavigate(Screen.EDIT_PROFILE)}
            className="px-6 py-2 bg-accent text-blue-900 rounded-full font-bold text-sm shadow-lg shadow-black/10 hover:bg-accent-hover transition-colors"
          >
            Editar Perfil
          </button>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-20">
        {/* Menu Container Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-lg">Menu do Usuário</h3>
          </div>

          <div className="p-2 flex flex-col gap-2">
            {/* ADMIN ONLY BUTTON */}
            {user.isAdmin && (
              <CardButton
                icon={<ShieldCheck className="w-5 h-5 text-white" />}
                label="Painel Administrativo"
                bgIcon="bg-primary"
                onClick={() => onNavigate(Screen.ADMIN_PANEL)}
              />
            )}

            <CardButton
              icon={<Tag className="w-5 h-5 text-primary" />}
              label="Meus Anúncios"
              bgIcon="bg-blue-50"
              onClick={() => onNavigate(Screen.MY_ADS)}
            />
            <CardButton
              icon={<Heart className="w-5 h-5 text-primary" />}
              label="Favoritos"
              bgIcon="bg-blue-50"
              onClick={() => onNavigate(Screen.FAVORITES)}
            />
            <CardButton
              icon={<History className="w-5 h-5 text-primary" />}
              label="Histórico de Transações"
              bgIcon="bg-blue-50"
              onClick={() => onNavigate(Screen.HISTORY)}
            />
            <CardButton
              icon={<Settings className="w-5 h-5 text-primary" />}
              label="Configurações & Segurança"
              bgIcon="bg-blue-50"
              onClick={() => onNavigate(Screen.SETTINGS)}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
