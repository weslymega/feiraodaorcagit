
import React from 'react';
import { Mail, Phone, MapPin, Calendar, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Header } from '../components/Shared';
import { User } from '../types';

interface AccountDataProps {
  user: User;
  onBack: () => void;
  onEdit: () => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-gray-900 font-medium text-base">{value || 'Não informado'}</p>
    </div>
  </div>
);

export const AccountData: React.FC<AccountDataProps> = ({ user, onBack, onEdit }) => {
  // Mock data for display purposes
  const joinDate = "15 de Março de 2023";
  const userId = "#8839201";

  return (
    <div className="min-h-screen bg-white pb-24 animate-in slide-in-from-right duration-300">
      <Header title="Dados da Conta" onBack={onBack} />

      <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-gray-50/50">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full p-1 bg-white shadow-sm">
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover" 
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white" title="Conta Verificada">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
        <p className="text-gray-500 text-sm mb-4">ID: {userId}</p>
        
        <button 
          onClick={onEdit}
          className="text-primary font-bold text-sm hover:underline"
        >
          Editar informações
        </button>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Informações Pessoais</h3>
        
        <div className="bg-white rounded-xl">
          <InfoRow 
            icon={<Mail className="w-5 h-5" />} 
            label="E-mail" 
            value={user.email} 
          />
          <InfoRow 
            icon={<Phone className="w-5 h-5" />} 
            label="Telefone" 
            value={user.phone || ''} 
          />
          <InfoRow 
            icon={<MapPin className="w-5 h-5" />} 
            label="Localização" 
            value={user.location || ''} 
          />
          <InfoRow 
            icon={<Calendar className="w-5 h-5" />} 
            label="Membro Desde" 
            value={joinDate} 
          />
          <InfoRow 
            icon={<UserIcon className="w-5 h-5" />} 
            label="Bio" 
            value={user.bio || 'Sem biografia.'} 
          />
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
                <h4 className="font-bold text-blue-900 text-sm mb-1">Conta Verificada</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                    Seus dados estão protegidos e validados conforme nossas diretrizes de segurança e privacidade.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
