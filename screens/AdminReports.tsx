import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Users, ShoppingBag, TrendingUp,
  DollarSign, AlertCircle, RefreshCcw, LogOut
} from 'lucide-react';
import { api, supabase } from '../services/api';

interface AdminReportsProps {
  onBack: () => void;
}

interface StatsData {
  totalUsers: number;
  activeAds: number;
  totalRevenue: number;
  plansSold: number;
}

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
}> = ({ title, value, icon, bgClass, textClass }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36 transition-all duration-300 hover:shadow-md text-left">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2.5 rounded-xl ${bgClass} ${textClass}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black text-gray-900">{value}</h3>
    </div>
  </div>
);

export const AdminReports: React.FC<AdminReportsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar Sessão
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente.");
      }

      // DEBUG: Decodificar o JWT para ver o que tem dentro
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        console.log("🔑 JWT Session Payload:", payload);
        if (payload.role !== 'authenticated') {
          console.warn("⚠️ ALERTA: O papel do JWT não é 'authenticated'! É:", payload.role);
        }
      } catch (e) {
        console.error("❌ Erro ao decodificar JWT:", e);
      }

      setCurrentUser(session.user);

      // 2. Tentar Invocar Função com Cabeçalho Explícito
      // Isso ajuda a diagnosticar se o SDK está falhando ao injetar o token
      const { data, error: funcError } = await supabase.functions.invoke('admin_get_stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (funcError) {
        console.error("❌ Erro na Edge Function:", funcError);

        let errorMsg = "Falha na comunicação com o servidor.";
        try {
          const errorBody = await (funcError as any).context?.json?.().catch(() => null);
          if (errorBody) {
            console.log("📦 Detalhes do Erro (Body):", errorBody);
            errorMsg = errorBody.message || errorBody.error || errorMsg;
            if (errorBody.code) errorMsg += ` (${errorBody.code})`;
          }
        } catch (e) {
          errorMsg = funcError.message || errorMsg;
        }

        throw new Error(errorMsg);
      }

      setStats(data);
    } catch (err: any) {
      console.error("❌ Erro ao carregar relatórios:", err);
      let msg = err.message || "Erro de conexão com o servidor de auditoria.";

      if (err.status === 401 || msg.includes("Invalid JWT")) {
        msg = "JWT Inválido (401). Saia (Logout) e entre novamente no app.";
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Autenticando e gerando relatórios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Erro de Acesso</h3>
        <p className="text-gray-500 mb-6 max-w-xs">{error}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={loadStats}
            className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95"
          >
            <RefreshCcw className="w-5 h-5" />
            Tentar Sincronizar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          >
            Recarregar App (F5)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="sticky top-0 z-[100] bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Relatórios Seguros</h1>
        </div>
        <button onClick={loadStats} className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors font-bold flex items-center gap-1">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-xs">Atualizar</span>
        </button>
      </div>

      <div className="p-4 space-y-6">

        {/* Context Label */}
        <div className="flex items-center gap-2 text-sm text-gray-500 font-semibold px-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Fonte: Supabase Live Data</span>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4">
          <KPICard
            title="Total de Usuários"
            value={stats?.totalUsers ?? 0}
            icon={<Users className="w-6 h-6" />}
            bgClass="bg-blue-50"
            textClass="text-primary"
          />
          <KPICard
            title="Anúncios Ativos"
            value={stats?.activeAds ?? 0}
            icon={<ShoppingBag className="w-6 h-6" />}
            bgClass="bg-emerald-50"
            textClass="text-emerald-600"
          />
          <KPICard
            title="Receita Gerada"
            value={`R$ ${(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign className="w-6 h-6" />}
            bgClass="bg-amber-50"
            textClass="text-amber-600"
          />
          <KPICard
            title="Planos Vendidos"
            value={stats?.plansSold ?? 0}
            icon={<TrendingUp className="w-6 h-6" />}
            bgClass="bg-rose-50"
            textClass="text-rose-600"
          />
        </div>

        {/* Info Box / Debug */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Auditoria & Segurança</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            As estatísticas são consolidadas no servidor para garantir proteção de dados.
            Abaixo seguem os detalhes da sua sessão atual para verificação.
          </p>

          <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 font-mono text-[10px]">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400">ADMIN:</span>
              <span className="text-gray-900 font-bold">{currentUser?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">JWT STATUS:</span>
              <span className="text-green-600 font-bold">SENT TO SERVER</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs py-2 border-b border-gray-50">
              <span className="text-gray-400">Protocolo:</span>
              <span className="text-blue-600 font-bold">Edge Function JWT Guard</span>
            </div>
            <div className="flex justify-between text-xs py-2">
              <span className="text-gray-400">Timestamp:</span>
              <span className="text-gray-900 font-bold">{new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* Botão de Logout para resolver 401 */}
        <div className="p-2">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-2 text-red-500 text-xs font-bold py-3 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair e Limpar Cache (Resolve 401)
          </button>
        </div>

      </div>
    </div>
  );
};