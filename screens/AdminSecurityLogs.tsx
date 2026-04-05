// screens/AdminSecurityLogs.tsx
import React, { useState, useEffect } from 'react';
import { 
    ChevronLeft, ShieldAlert, ShieldCheck, 
    AlertTriangle, Info, Search, RefreshCcw, 
    Calendar, User, Globe, Layout 
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

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getEventIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <ShieldAlert className="w-4 h-4" />;
            case 'high': return <AlertTriangle className="w-4 h-4" />;
            case 'medium': return <Info className="w-4 h-4" />;
            default: return <ShieldCheck className="w-4 h-4" />;
        }
    };

    const filteredLogs = logs.filter(log => 
        log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ip_address && log.ip_address.includes(searchTerm)) ||
        JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 z-[100] bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Monitor de Segurança</h1>
                </div>
                <button onClick={loadLogs} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <RefreshCcw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-4 max-w-4xl mx-auto">
                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filtrar por evento, IP ou metadados..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                </div>

                {loading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                        <p className="text-gray-500 font-medium">Carregando logs...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg border ${getSeverityStyles(log.severity)}`}>
                                            {getEventIcon(log.severity)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{log.event_type}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> 
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityStyles(log.severity)}`}>
                                        {log.severity}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Globe className="w-4 h-4 opacity-40" />
                                        <span className="font-medium">{log.ip_address || 'IP Oculto'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User className="w-4 h-4 opacity-40" />
                                        <span className="truncate">{log.user_id ? `ID: ${log.user_id.slice(0, 8)}...` : 'Anônimo'}</span>
                                    </div>
                                </div>

                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            <Layout className="w-3 h-3" /> Metadados
                                        </div>
                                        <pre className="text-[11px] text-gray-600 overflow-x-auto font-mono">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}

                        {filteredLogs.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <p>Nenhum log de segurança encontrado para este filtro.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
