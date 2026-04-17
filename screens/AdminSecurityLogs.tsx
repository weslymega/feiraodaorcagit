// screens/AdminSecurityLogs.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChevronLeft, ShieldAlert, ShieldCheck, 
    AlertTriangle, Info, Search, RefreshCcw, 
    Calendar, User, Globe, Layout, Trash2,
    Activity, Shield, Lock, Fingerprint,
    ArrowRight, Copy, Terminal, ShieldOff, Unlock
} from 'lucide-react';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

interface AdminSecurityLogsProps {
    onBack: () => void;
}

export const AdminSecurityLogs: React.FC<AdminSecurityLogsProps> = ({ onBack }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high' | 'medium' | 'info'>('all');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await api.getSecurityLogs();
            setLogs(data);
        } catch (err) {
            console.error('Failed to load security logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm('Atenção: Apenas logs DEPRECADOS (mais de 7 dias de idade) serão dizimados durante a varredura e uma ação de auditoria será ativada. Deseja prosseguir de forma irreversível?')) return;
        
        try {
            setLoading(true);
            const response = await api.clearSecurityLogs();
            alert(response?.message || 'Limpeza enviada com sucesso ao servidor.');
            loadLogs();
        } catch (err: any) {
            console.error('Failed to clear logs:', err);
            alert(`Falha Crítica na operação:\n\n${err.message || 'Erro de permissão no backend.'}`);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        // Toast logic could be here
    };

    const stats = useMemo(() => {
        const critical = logs.filter(l => l.severity === 'critical').length;
        const high = logs.filter(l => l.severity === 'high').length;
        const today = logs.filter(l => {
            const date = new Date(l.created_at);
            const now = new Date();
            return date.toDateString() === now.toDateString();
        }).length;
        
        return { critical, high, today };
    }, [logs]);

    const getSeverityStyles = (severity: string): { bg: string, text: string, border: string, icon: string } => {
        switch (severity) {
            case 'critical': 
                return { 
                    bg: 'bg-red-50', 
                    text: 'text-red-700', 
                    border: 'border-red-100',
                    icon: 'text-red-500'
                };
            case 'high': 
                return { 
                    bg: 'bg-orange-50', 
                    text: 'text-orange-700', 
                    border: 'border-orange-100',
                    icon: 'text-orange-500'
                };
            case 'medium': 
                return { 
                    bg: 'bg-yellow-50', 
                    text: 'text-yellow-700', 
                    border: 'border-yellow-100',
                    icon: 'text-yellow-500'
                };
            default: 
                return { 
                    bg: 'bg-blue-50', 
                    text: 'text-blue-700', 
                    border: 'border-blue-100',
                    icon: 'text-blue-500'
                };
        }
    };

    const getEventIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <ShieldAlert className="w-5 h-5" />;
            case 'high': return <AlertTriangle className="w-5 h-5" />;
            case 'medium': return <Info className="w-5 h-5" />;
            default: return <ShieldCheck className="w-5 h-5" />;
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.ip_address && log.ip_address.includes(searchTerm)) ||
            JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase());
        
        if (activeTab === 'all') return matchesSearch;
        return matchesSearch && log.severity === activeTab;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-in slide-in-from-right duration-500">
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* Premium Header */}
            <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="p-2.5 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Monitor de Segurança</h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Auditoria em Tempo Real</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleClearLogs} 
                        disabled={loading} 
                        className="p-2.5 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                        title="Limpar logs antigos (> 7 dias)"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={loadLogs} 
                        disabled={loading} 
                        className="p-2.5 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Críticos</p>
                            <p className="text-2xl font-black text-slate-900">{stats.critical}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atenção Alta</p>
                            <p className="text-2xl font-black text-slate-900">{stats.high}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eventos Hoje</p>
                            <p className="text-2xl font-black text-slate-900">{stats.today}</p>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por evento, IP ou metadados..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200/60 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                        {(['all', 'critical', 'high', 'medium'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                    activeTab === tab 
                                    ? 'bg-white text-slate-900 shadow-sm scale-[1.02]' 
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab === 'all' ? 'Ver Tudo' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logs List */}
                {loading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 rounded-3xl bg-primary/10 animate-pulse flex items-center justify-center">
                                <Shield className="w-8 h-8 text-primary animate-bounce" />
                            </div>
                        </div>
                        <p className="text-slate-900 font-black text-lg">Iniciando Varredura...</p>
                        <p className="text-slate-400 text-sm mt-1">Conectando ao núcleo de segurança</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLogs.map((log) => {
                            const styles = getSeverityStyles(log.severity);
                            return (
                                <div 
                                    key={log.id} 
                                    className="group bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${styles.bg} ${styles.icon}`}>
                                                {getEventIcon(log.severity)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{log.event_type}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles.bg} ${styles.text} ${styles.border}`}>
                                                        {log.severity}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" /> 
                                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                                    </p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                                        <Activity className="w-3.5 h-3.5" />
                                                        {/* Simple relative time logic */}
                                                        {Math.max(0, Math.floor((Date.now() - new Date(log.created_at).getTime()) / 60000))} min atrás
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 self-end sm:self-start">
                                            {log.user_id && (
                                                <button 
                                                    onClick={async () => {
                                                        if (window.confirm("Deseja alterar o status de bloqueio deste usuário?")) {
                                                            try {
                                                                setLoading(true);
                                                                // We don't know the current status easily without fetching profile, 
                                                                // so we'll just toggle it via a dedicated endpoint if it existed, 
                                                                // or fetch it first. For now, since we only have user_id, 
                                                                // let's just use the api.toggleUserBlock with true (defaulting to blocking).
                                                                await api.toggleUserBlock(log.user_id, true);
                                                                alert("Usuário bloqueado com sucesso.");
                                                            } catch (e: any) {
                                                                alert("Erro ao bloquear: " + e.message);
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }
                                                    }}
                                                    className="p-2 rounded-xl bg-orange-50 text-orange-500 hover:bg-orange-100 transition-all"
                                                    title="Bloquear Usuário"
                                                >
                                                    <ShieldOff className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => copyToClipboard(log.id)}
                                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                                                title="Copiar ID do Log"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group/ip">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origem de rede</p>
                                                    <p className="text-slate-700 font-bold font-mono">{log.ip_address || 'IP Oculto'}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => copyToClipboard(log.ip_address)}
                                                className="opacity-0 group-hover/ip:opacity-100 p-1.5 rounded-lg hover:bg-white transition-all text-slate-400"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group/user">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                                    <Fingerprint className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assinatura Digital</p>
                                                    <p className="text-slate-700 font-bold font-mono truncate max-w-[120px]">
                                                        {log.user_id ? `uid_${log.user_id.slice(0, 8)}` : 'Sessão Anônima'}
                                                    </p>
                                                </div>
                                            </div>
                                            {log.user_id && (
                                                <button 
                                                    onClick={() => copyToClipboard(log.user_id)}
                                                    className="opacity-0 group-hover/user:opacity-100 p-1.5 rounded-lg hover:bg-white transition-all text-slate-400"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                        <div className="mt-6 bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800 group/meta shadow-lg shadow-black/20">
                                            <div className="bg-slate-800/50 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload de Auditoria</span>
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard(JSON.stringify(log.metadata, null, 2))}
                                                    className="p-1 px-2 rounded-md bg-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-600 transition-all uppercase"
                                                >
                                                    Copiar JSON
                                                </button>
                                            </div>
                                            <pre className="p-4 text-[11px] text-emerald-400/90 overflow-x-auto font-mono scrollbar-hide">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {filteredLogs.length === 0 && !loading && (
                            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-inner">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-900 font-black">Nenhum alerta detectado</p>
                                <p className="text-slate-400 text-sm mt-1">O sistema está operando dentro dos parâmetros de segurança.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Actions Float */}
            <div className="fixed bottom-6 right-6 z-[100]">
                <button 
                    onClick={loadLogs}
                    disabled={loading}
                    className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all group disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Activity className="w-4 h-4 text-emerald-400 group-hover:animate-pulse" />
                    )}
                    Live Scanner
                </button>
            </div>
        </div>
    );
};
