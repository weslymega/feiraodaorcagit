
import React from 'react';
import { ChevronLeft, Map, ToggleLeft, ToggleRight, Server, Globe, Power } from 'lucide-react';
import { Header } from '../components/Shared';

interface AdminSystemSettingsProps {
  onBack: () => void;
  fairActive: boolean;
  onToggleFair: (active: boolean) => void;
  maintenanceMode: boolean;
  onToggleMaintenance: (active: boolean) => void;
}

const SettingToggle: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  checked: boolean; 
  onChange: () => void; 
  disabled?: boolean;
}> = ({ icon, title, description, checked, onChange, disabled }) => (
  <div className={`flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <div className="flex items-start gap-4">
      <div className={`p-2 rounded-lg ${checked ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    
    <button onClick={onChange} className="text-primary transition-colors focus:outline-none" disabled={disabled}>
      {checked ? (
        <ToggleRight className="w-10 h-10 fill-primary/10" />
      ) : (
        <ToggleLeft className="w-10 h-10 text-gray-300" />
      )}
    </button>
  </div>
);

export const AdminSystemSettings: React.FC<AdminSystemSettingsProps> = ({ 
  onBack, 
  fairActive, 
  onToggleFair,
  maintenanceMode,
  onToggleMaintenance
}) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">
      <Header title="Configurações do Sistema" onBack={onBack} />

      <div className="p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Funcionalidades do App</h2>
        
        <SettingToggle 
          icon={<Map className="w-5 h-5" />}
          title="Seção 'Estou na Feira'"
          description="Habilita a visibilidade do carrossel 'Estou na feira agora' para todos os usuários no Dashboard."
          checked={fairActive}
          onChange={() => onToggleFair(!fairActive)}
        />

        <SettingToggle 
            icon={<Server className="w-5 h-5" />}
            title="Modo Manutenção"
            description="Bloqueia o acesso de usuários comuns. Apenas administradores podem acessar o app."
            checked={maintenanceMode}
            onChange={() => onToggleMaintenance(!maintenanceMode)}
        />

        <div className="opacity-50 pointer-events-none filter grayscale">
            <SettingToggle 
                icon={<Globe className="w-5 h-5" />}
                title="API FIPE Externa"
                description="Usa conexão direta com servidor FIPE."
                checked={true}
                onChange={() => {}}
                disabled
            />
        </div>

        <div className={`mt-8 p-4 border rounded-xl transition-colors ${maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <h4 className={`flex items-center gap-2 font-bold mb-2 ${maintenanceMode ? 'text-red-800' : 'text-yellow-800'}`}>
                <Power className="w-4 h-4" /> {maintenanceMode ? 'Sistema Bloqueado' : 'Importante'}
            </h4>
            <p className={`text-xs leading-relaxed ${maintenanceMode ? 'text-red-700' : 'text-yellow-700'}`}>
                {maintenanceMode 
                  ? "O Modo Manutenção está ATIVO. Usuários comuns não conseguem navegar no aplicativo. Lembre-se de desativar após concluir as atualizações."
                  : "As alterações feitas aqui afetam todos os usuários do aplicativo em tempo real. Certifique-se de que a funcionalidade está pronta para uso antes de ativar."
                }
            </p>
        </div>

      </div>
    </div>
  );
};
