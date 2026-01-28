
import React, { useMemo } from 'react';
import {
  Users,
  FileText,
  AlertTriangle,
  BarChart,
  ChevronRight,
  Settings,
  Shield,
  Car,
  Home,
  Layers,
  Bell,
  Wrench,
  Megaphone,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ArrowUp
} from 'lucide-react';
import { AdStatus, Screen } from '../types';
import {
  POPULAR_CARS
} from '../constants';
import { api, supabase } from '../services/api';
import { Loader2 } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
  onNavigate?: (screen: Screen) => void;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  growth?: string;
  isPositive?: boolean;
  growthColor?: string;
  icon?: React.ReactNode;
  bgClass?: string;
  textClass?: string;
}> = ({ title, value, growth, isPositive = true, growthColor, icon, bgClass, textClass }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
    <div className="flex justify-between items-start">
      <span className="text-gray-500 text-sm font-medium">{title}</span>
      {icon && (
        <div className={`p-1.5 rounded-lg ${bgClass}`}>
          <div className={textClass}>{icon}</div>
        </div>
      )}
    </div>
    <div>
      <span className="text-2xl font-bold text-gray-900 block mb-1">{value}</span>
      {growth && (
        <span className={`text-xs font-bold flex items-center gap-1 ${growthColor ? growthColor : (isPositive ? 'text-green-600' : 'text-red-500')}`}>
          {isPositive ? <ArrowUp className="w-3 h-3" /> : ''}{growth}
        </span>
      )}
    </div>
  </div>
);

const ManagementItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  bgClass: string;
  iconClass: string;
  onClick?: () => void;
}> = ({ icon, label, bgClass, iconClass, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors group mb-3 last:mb-0 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass}`}>
        <div className={iconClass}>{icon}</div>
      </div>
      <span className="font-medium text-gray-800 text-base">{label}</span>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
  </button>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onNavigate }) => {

  const [loading, setLoading] = React.useState(true);
  const [counts, setCounts] = React.useState({
    totalUsers: 0,
    activeAds: 0,
    pendingAds: 0,
    revenue: 0
  });

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // 1. Fetch Users Count
      const users = await api.getAllUsers();

      // 2. Fetch Ads for stats
      // For now we fetch all profile metadata and ads from our API
      // In a very large app, we would use a specialized RPC function for counts
      const { data: adsCountData, error: adsError } = await supabase
        .from('anuncios')
        .select('status, boost_plan');

      if (adsError) throw adsError;

      const activeCount = adsCountData?.filter(ad => ad.status === 'ativo' || ad.status === 'active').length || 0;
      const pendingCount = adsCountData?.filter(ad => ad.status === 'pendente' || ad.status === 'pending').length || 0;

      // Calculate revenue
      const revenue = adsCountData?.reduce((acc, ad) => {
        if (ad.boost_plan === 'premium') return acc + 100;
        if (ad.boost_plan === 'advanced') return acc + 60;
        if (ad.boost_plan === 'basic') return acc + 30;
        return acc;
      }, 0) || 0;

      setCounts({
        totalUsers: users.length,
        activeAds: activeCount,
        pendingAds: pendingCount,
        revenue: revenue
      });
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">

      {/* Custom Header similar to design */}
      <div className="bg-gray-50 sticky top-0 z-50 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors">
            <div className="w-6 h-0.5 bg-gray-800 mb-1.5"></div>
            <div className="w-6 h-0.5 bg-gray-800 mb-1.5"></div>
            <div className="w-6 h-0.5 bg-gray-800"></div>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Painel de Administrador</h1>
        </div>
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-800" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-50"></div>
        </div>
      </div>

      <div className="px-6">

        {/* Visão Geral Section */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Visão Geral</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard
            title="Total de Usuários"
            value={loading ? '-' : counts.totalUsers}
            growth={loading ? '' : "12%"}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-5 h-5" />}
            bgClass="bg-blue-100"
            textClass="text-blue-700"
          />
          <StatCard
            title="Anúncios Ativos"
            value={loading ? '-' : counts.activeAds}
            growth={loading ? '' : "5.4%"}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
            bgClass="bg-purple-100"
            textClass="text-purple-700"
          />
          <StatCard
            title="Pendentes"
            value={loading ? '-' : counts.pendingAds}
            growth={loading ? '' : "Ação Req."}
            growthColor="text-orange-600"
            isPositive={false}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
            bgClass="bg-orange-100"
            textClass="text-orange-700"
          />
          <StatCard
            title="Receita Total"
            value={loading ? '-' : `R$ ${counts.revenue.toLocaleString('pt-BR')}`}
            growth={loading ? '' : "8.3%"}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-5 h-5" />}
            bgClass="bg-green-100"
            textClass="text-green-700"
          />
        </div>

        {/* Gerenciamento Section */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Gerenciamento</h2>
        <div className="flex flex-col">
          <ManagementItem
            icon={<Users className="w-5 h-5" />}
            label="Gerenciar Usuários"
            bgClass="bg-green-100"
            iconClass="text-green-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_USERS)}
          />
          <ManagementItem
            icon={<Car className="w-5 h-5" />}
            label="Gerenciar Anúncios (Veículos)"
            bgClass="bg-green-100"
            iconClass="text-green-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_VEHICLES)}
          />
          <ManagementItem
            icon={<Home className="w-5 h-5" />}
            label="Gerenciar Anúncios (Imóveis)"
            bgClass="bg-green-100"
            iconClass="text-green-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_REAL_ESTATE)}
          />
          <ManagementItem
            icon={<Wrench className="w-5 h-5" />}
            label="Gerenciar Peças e Serviços"
            bgClass="bg-green-100"
            iconClass="text-green-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_PARTS_SERVICES)}
          />
          <ManagementItem
            icon={<Megaphone className="w-5 h-5" />}
            label="Gerenciar Propagandas (Home)"
            bgClass="bg-blue-100"
            iconClass="text-blue-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_DASHBOARD_PROMOTIONS)}
          />
          <ManagementItem
            icon={<Megaphone className="w-5 h-5" />}
            label="Gerenciar Propagandas (Imóveis)"
            bgClass="bg-blue-100"
            iconClass="text-blue-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_REAL_ESTATE_PROMOTIONS)}
          />
          <ManagementItem
            icon={<Megaphone className="w-5 h-5" />}
            label="Gerenciar Propagandas (Peças e Serviços)"
            bgClass="bg-blue-100"
            iconClass="text-blue-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_PARTS_SERVICES_PROMOTIONS)}
          />
          <ManagementItem
            icon={<Megaphone className="w-5 h-5" />}
            label="Gerenciar Propagandas (Veículos)"
            bgClass="bg-blue-100"
            iconClass="text-blue-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_VEHICLES_PROMOTIONS)}
          />
          <ManagementItem
            icon={<BarChart className="w-5 h-5" />}
            label="Relatórios e Estatísticas"
            bgClass="bg-green-100"
            iconClass="text-green-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_REPORTS)}
          />
          <ManagementItem
            icon={<Shield className="w-5 h-5" />}
            label="Moderação de Conteúdo"
            bgClass="bg-red-100"
            iconClass="text-red-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_CONTENT_MODERATION)}
          />
          <ManagementItem
            icon={<Settings className="w-5 h-5" />}
            label="Configurações do Sistema"
            bgClass="bg-gray-100"
            iconClass="text-gray-700"
            onClick={() => onNavigate && onNavigate(Screen.ADMIN_SYSTEM_SETTINGS)}
          />
        </div>

      </div>
    </div>
  );
};
