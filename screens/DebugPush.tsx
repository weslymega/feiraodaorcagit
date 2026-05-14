
import React, { useState, useEffect } from 'react';
import { Header } from '../components/Shared';
import { PushService } from '../services/pushService';
import { Copy, RefreshCw, Bell, Shield, Info, Terminal } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

interface DebugPushProps {
    onBack: () => void;
}

export const DebugPush: React.FC<DebugPushProps> = ({ onBack }) => {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<string>('checking...');
    const [channels, setChannels] = useState<any[]>([]);
    const [lastPayload, setLastPayload] = useState<string | null>(null);

    const loadDebugInfo = async () => {
        setLoading(true);
        try {
            if (Capacitor.isNativePlatform()) {
                const { receive } = await FirebaseMessaging.checkPermissions();
                setPermissionStatus(receive);

                const currentToken = await PushService.getToken();
                setToken(currentToken);

                if (Capacitor.getPlatform() === 'android') {
                    const { channels } = await FirebaseMessaging.listChannels();
                    setChannels(channels);
                }
            } else {
                setPermissionStatus('web-platform');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDebugInfo();
        
        // Carregar último payload do localStorage se existir
        const saved = localStorage.getItem('last_push_payload');
        if (saved) setLastPayload(saved);

        // Listener temporário para atualizar a UI em tempo real neste teste
        const listener = FirebaseMessaging.addListener('notificationReceived', (event) => {
            const payloadStr = JSON.stringify(event.notification, null, 2);
            setLastPayload(payloadStr);
            localStorage.setItem('last_push_payload', payloadStr);
        });

        return () => {
            listener.then(l => l.remove());
        };
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header title="Debug Notificações" onBack={onBack} />

            <div className="p-4 space-y-4">
                {/* Status Card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Status do Sistema
                        </h3>
                        <button 
                            onClick={loadDebugInfo}
                            className={`p-2 bg-gray-50 rounded-full ${loading ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Permissão</span>
                            <span className={`text-sm font-bold ${permissionStatus === 'granted' ? 'text-green-600' : 'text-red-500'}`}>
                                {permissionStatus.toUpperCase()}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Plataforma</span>
                            <span className="text-sm font-bold text-gray-700 capitalize">
                                {Capacitor.getPlatform()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Token Card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        Token FCM
                    </h3>
                    {token ? (
                        <div className="relative group">
                            <div className="bg-gray-900 text-green-400 p-3 rounded-xl text-[10px] font-mono break-all leading-tight">
                                {token}
                            </div>
                            <button 
                                onClick={() => copyToClipboard(token)}
                                className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-gray-400 text-sm italic">Nenhum token encontrado. Verifique as permissões.</div>
                    )}
                    <p className="mt-2 text-[10px] text-gray-400">
                        Este token é necessário para os scripts de teste no terminal.
                    </p>
                </div>

                {/* Android Channels Card */}
                {Capacitor.getPlatform() === 'android' && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            Canais (Android)
                        </h3>
                        <div className="space-y-2">
                            {channels.length > 0 ? channels.map((ch, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-700">{ch.id}</span>
                                        <span className="text-gray-400">{ch.name}</span>
                                    </div>
                                    <span className="bg-blue-100 text-primary px-2 py-0.5 rounded-full font-bold">
                                        Imp: {ch.importance}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-gray-400 text-sm italic">Carregando canais...</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Last Payload Card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-primary" />
                        Último Payload Recebido
                    </h3>
                    {lastPayload ? (
                        <pre className="bg-gray-900 text-blue-300 p-3 rounded-xl text-[10px] font-mono overflow-auto max-h-60">
                            {lastPayload}
                        </pre>
                    ) : (
                        <div className="text-gray-400 text-sm italic">Nenhum payload recebido ainda nesta sessão.</div>
                    )}
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <h4 className="text-blue-800 font-bold text-sm mb-2">Instruções:</h4>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                        <li>Copie o token acima.</li>
                        <li>No terminal do seu PC, use o script debug_push_payload.cjs</li>
                        <li>Envie mensagens e veja se aparecem aqui em tempo real.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
