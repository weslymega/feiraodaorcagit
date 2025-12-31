
import React, { useEffect } from 'react';
import { 
  Home, 
  MessageSquare, 
  ChevronLeft,
  Plus,
  Menu,
  CheckCircle,
  Info,
  Heart
} from 'lucide-react';
import { Screen } from '../types';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, rightElement }) => {
  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-primary">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
      </div>
      <div>{rightElement}</div>
    </div>
  );
};

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, unreadCount = 0 }) => {
  const getIconClass = (screen: Screen) => {
    return currentScreen === screen ? "text-primary" : "text-gray-400";
  };
  
  const getLabelClass = (screen: Screen) => {
    return currentScreen === screen ? "text-primary font-bold" : "text-gray-400 font-medium";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 max-w-md mx-auto shadow-[0_-5px_15px_rgba(0,0,0,0.05)] rounded-t-[20px]">
      <button 
        onClick={() => onNavigate(Screen.DASHBOARD)} 
        className={`flex flex-col items-center gap-1 transition-colors`}
      >
        <Home className={`w-6 h-6 ${getIconClass(Screen.DASHBOARD)}`} />
        <span className={`text-[10px] ${getLabelClass(Screen.DASHBOARD)}`}>Início</span>
      </button>

      <button 
        onClick={() => onNavigate(Screen.MESSAGES)}
        className={`flex flex-col items-center gap-1 transition-colors`}
      >
        <div className="relative">
          <MessageSquare className={`w-6 h-6 ${getIconClass(Screen.MESSAGES)}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-300 ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] ${getLabelClass(Screen.MESSAGES)}`}>Chat</span>
      </button>

      <button 
        onClick={() => onNavigate(Screen.CREATE_AD)}
        className="flex flex-col items-center gap-1 group -mt-8"
      >
         <div className="bg-accent text-white p-4 rounded-full shadow-lg shadow-yellow-200 group-active:scale-95 transition-all border-4 border-gray-50 group-hover:bg-accent-hover">
            <Plus className="w-7 h-7" />
         </div>
         <span className="text-[10px] font-medium text-gray-500 mt-1">Anunciar</span>
      </button>

      <button 
        onClick={() => onNavigate(Screen.FAVORITES)} 
        className={`flex flex-col items-center gap-1 transition-colors`}
      >
        <div className="relative">
             <Heart className={`w-6 h-6 ${currentScreen === Screen.FAVORITES ? 'fill-primary text-primary' : 'text-gray-400'}`} />
        </div>
        <span className={`text-[10px] ${getLabelClass(Screen.FAVORITES)}`}>Favs</span>
      </button>

      <button 
        onClick={() => onNavigate(Screen.USER_PANEL)}
        className={`flex flex-col items-center gap-1 transition-colors`}
      >
        <Menu className={`w-6 h-6 ${getIconClass(Screen.USER_PANEL)}`} />
        <span className={`text-[10px] ${getLabelClass(Screen.USER_PANEL)}`}>Menu</span>
      </button>
    </div>
  );
};

export const CardButton: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  onClick?: () => void;
  bgIcon?: string;
}> = ({ icon, label, onClick, bgIcon = "bg-gray-100" }) => {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all mb-0 border border-gray-100 active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${bgIcon}`}>
          {icon}
        </div>
        <span className="text-gray-800 font-semibold">{label}</span>
      </div>
      <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
    </button>
  );
};

export const PriceTag: React.FC<{ value: number }> = ({ value }) => {
  const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  return <span className="text-primary font-bold text-lg">{formatted}</span>;
};

// --- TOAST COMPONENT ---
export interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-600 text-white shadow-green-200',
    info: 'bg-gray-800 text-white shadow-gray-200',
    error: 'bg-red-500 text-white shadow-red-200'
  };

  const icon = {
    success: <CheckCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    error: <Info className="w-5 h-5" />
  };

  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] flex items-center justify-center pointer-events-none animate-in slide-in-from-top duration-300`}>
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl ${styles[type]} max-w-sm w-full`}>
        {icon[type]}
        <span className="font-bold text-sm">{message}</span>
      </div>
    </div>
  );
};
