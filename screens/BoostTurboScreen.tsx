import React, { useState, useEffect } from 'react';
import { AdItem, TurboPlan } from '../types';
import { api, supabase } from '../services/api';
import { turboService } from '../services/turboService';
import { Header } from '../components/Shared';
import { Play, Loader2, Zap, Star, ShieldAlert } from 'lucide-react';

interface BoostTurboScreenProps {
    adId: string | null;
    onBack: () => void;
}

export const BoostTurboScreen: React.FC<BoostTurboScreenProps> = ({ adId, onBack }) => {
    const [ad, setAd] = useState<AdItem | null>(null);
    const [loadingAd, setLoadingAd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!adId) return;
        let isMounted = true;
        const fetchAd = async () => {
            setLoadingAd(true);
            try {
                const fetchedAd = await api.getAdById(adId);
                if (isMounted) setAd(fetchedAd as AdItem);
            } catch (err) {
                console.error('Failed to load ad details for turbo:', err);
                if (isMounted) setAd(null);
            } finally {
                if (isMounted) setLoadingAd(false);
            }
        };
        fetchAd();
        return () => { isMounted = false; };
    }, [adId]);

    if (loadingAd) {
        return (
            <div className="flex flex-col h-full bg-gray-50 pb-24">
                <Header title="Impulsionar Anúncio" onBack={onBack} />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Carregando detalhes do anúncio...</p>
                </div>
            </div>
        );
    }

    if (!ad) {
        return (
            <div className="flex flex-col h-full bg-gray-50 pb-24">
                <Header title="Impulsionar Anúncio" onBack={onBack} />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Anúncio não encontrado</h2>
                    <button onClick={onBack} className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md">Voltar</button>
                </div>
            </div>
        );
    }

    const handleSelectPlan = async (planId: string) => {
        setLoading(true);
        setError(null);
        try {
            // Garantimos que a sessão esteja ativa no Supabase antes de invocar
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão expirada. Faça login novamente.');

            // O plano agora é ativado via Edge Function 'activate-turbo' segura
            const { data, error: invokeError } = await supabase.functions.invoke('activate-turbo', {
                body: { adId: ad.id, turboType: planId },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (invokeError) {
                console.error('Invoke Error:', invokeError);
                let msg = 'Não foi possível ativar o Turbo. Tente novamente.';

                try {
                    // Supabase functions invoker usually throws FunctionsHttpError with context payload
                    const errorStr = JSON.stringify(invokeError);

                    if (invokeError.message.includes('non-2xx') || errorStr.includes('409') || errorStr.includes('active')) {
                        msg = '🚀 Você já possui um Turbo em andamento para este anúncio.\nFinalize o processo para ativar seu destaque.';
                    } else if (typeof (invokeError as any).context?.text === 'function') {
                        const bodyStr = await (invokeError as any).context.text();
                        const parsed = JSON.parse(bodyStr);
                        if (parsed.error) msg = parsed.error;
                    }
                } catch (e) {
                    // Fallback
                    if (invokeError.message.includes('non-2xx')) {
                        msg = '🚀 Você já possui um Turbo em andamento para este anúncio.\nFinalize o processo para ativar seu destaque.';
                    }
                }
                throw new Error(msg);
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            // O novo retorno é sessionId e requiredSteps
            if (data?.success && data?.sessionId) {
                alert(`Sessão Criada! \n\nSessão: ${data.sessionId}\nAnúncios a assistir: ${data.requiredSteps}\n\n(Fluxo de vídeo-ads em construção)`);
                onBack();
            } else {
                throw new Error('Falha ao iniciar ou processar a sessão.')
            }
        } catch (err: any) {
            console.error('Error activating turbo:', err);
            setError(err.message || 'Falha ao ativar o plano Turbo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 pb-24">
            <Header title="Ativar Turbo" onBack={onBack} />
            <div className="p-6">
                <div className="mb-6 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-sm border border-blue-200">
                        <Zap className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">Acelere suas Vendas!</h2>
                    <p className="text-sm text-gray-600 font-medium">Assista vídeos curtos e impulsione seu anúncio de forma 100% gratuita.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center shadow-sm border border-red-100 animate-in fade-in slide-in-from-top-2 whitespace-pre-line">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* PLANO PREMIUM */}
                    <div className="bg-white rounded-3xl p-5 border-2 border-gray-100 shadow-sm relative overflow-hidden transition-all hover:border-blue-300 animate-in slide-in-from-bottom-2 duration-300 delay-100">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase flex items-center gap-2">Turbo Premium <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /></h3>
                                <p className="text-xs text-gray-500 font-bold mt-1">Destaque mediano</p>
                            </div>
                        </div>
                        <ul className="text-sm text-gray-600 mb-6 space-y-2 font-medium">
                            <li className="flex items-center gap-2">↳ 2 Visualizações de vídeo</li>
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('premium')}
                            disabled={loading}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Começar Agora</>}
                        </button>
                    </div>

                    {/* PLANO PRO */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 border shadow-xl relative overflow-hidden text-white transition-all transform hover:-translate-y-1 animate-in slide-in-from-bottom-2 duration-300 delay-200">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-black uppercase flex items-center gap-2">Turbo Pro <Zap className="w-4 h-4 fill-current" /></h3>
                                <p className="text-xs text-blue-100 font-bold mt-1">Destaque aprimorado</p>
                            </div>
                            <span className="bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider border border-white/30 backdrop-blur-sm">Recomendado</span>
                        </div>
                        <ul className="text-sm text-blue-50 mb-6 space-y-2 font-medium">
                            <li className="flex items-center gap-2">↳ 5 Visualizações de vídeo</li>
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('pro')}
                            disabled={loading}
                            className="w-full py-4 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-black/10"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <><Play className="w-5 h-5 fill-current" /> Começar Agora</>}
                        </button>
                    </div>

                    {/* PLANO MAX */}
                    <div className="bg-white rounded-3xl p-5 border-2 border-orange-100 shadow-sm relative overflow-hidden transition-all hover:border-orange-300 animate-in slide-in-from-bottom-2 duration-300 delay-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-black text-orange-600 uppercase flex items-center gap-2">Turbo Max <Zap className="w-5 h-5 fill-current" /></h3>
                                <p className="text-xs text-gray-500 font-bold mt-1">Destaque máximo e imediato</p>
                            </div>
                        </div>
                        <ul className="text-sm text-gray-600 mb-6 space-y-2 font-medium relative z-10">
                            <li className="flex items-center gap-2">↳ 7 Visualizações de vídeo</li>
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('max')}
                            disabled={loading}
                            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-orange-200"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Começar Agora</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
