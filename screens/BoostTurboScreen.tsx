import React, { useState, useEffect } from 'react';
import { AdItem, TurboPlan } from '../types';
import { api, supabase } from '../services/api';
import { Header } from '../components/Shared';
import { Play, Loader2, Zap, Star, ShieldAlert, MonitorPlay, CheckCircle2 } from 'lucide-react';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

interface BoostTurboScreenProps {
    adId: string | null;
    onBack: () => void;
}

export const BoostTurboScreen: React.FC<BoostTurboScreenProps> = ({ adId, onBack }) => {
    const [ad, setAd] = useState<AdItem | null>(null);
    const [loadingAd, setLoadingAd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado da Sessão do Turbo e AdMob
    const [activeSession, setActiveSession] = useState<{ id: string, adId: string, requiredSteps: number, currentStep: number } | null>(null);
    const [adReady, setAdReady] = useState(false);
    const [watchingAd, setWatchingAd] = useState(false);

    useEffect(() => {
        if (!adId) return;
        let isMounted = true;
        const fetchAdAndSession = async () => {
            setLoadingAd(true);
            try {
                // Fetch Ad Details
                const fetchedAd = await api.getAdById(adId);
                if (isMounted) setAd(fetchedAd as AdItem);

                // Fetch Active Session for this AD
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData.session) {
                    const { data: turboSession } = await supabase
                        .from('ad_turbo_sessions')
                        .select('*')
                        .eq('ad_id', adId)
                        .eq('status', 'active')
                        .maybeSingle();

                    if (turboSession && isMounted) {
                        setActiveSession({
                            id: turboSession.id,
                            adId: turboSession.ad_id,
                            requiredSteps: turboSession.required_steps || 5, // Fallback se não existir na view
                            currentStep: turboSession.current_step || 0
                        });
                    }
                }

            } catch (err) {
                console.error('Failed to load ad details for turbo:', err);
                if (isMounted) setAd(null);
            } finally {
                if (isMounted) setLoadingAd(false);
            }
        };
        fetchAdAndSession();
        return () => { isMounted = false; };
    }, [adId]);

    // Inicialização do AdMob
    useEffect(() => {
        if (!activeSession) return;
        if (!Capacitor.isNativePlatform()) {
            console.log("AdMob requires Native Platform. Mocking behavior for development.");
        }

        let isMounted = true;

        const initAdMob = async () => {
            try {
                if (Capacitor.isNativePlatform()) {
                    await AdMob.initialize();

                    // TODO: Em produção usar seu ID real. 
                    // Android Test ID: ca-app-pub-3940256099942544/5224354917
                    // iOS Test ID: ca-app-pub-3940256099942544/1712485313
                    await AdMob.prepareRewardVideoAd({
                        adId: 'ca-app-pub-3940256099942544/5224354917'
                    });
                }
                if (isMounted) setAdReady(true);
            } catch (err) {
                console.error('Failed to prepare AdMob:', err);
                // Mesmo se falhar, preparamos o botão parar testar fallback web se necessário
                if (isMounted) setAdReady(true);
            }
        };

        initAdMob();

        let rewardListener: any;
        if (Capacitor.isNativePlatform()) {
            AdMob.addListener(RewardAdPluginEvents.Rewarded, async (reward) => {
                console.log("RewardAdPluginEvents.Rewarded disparado!", reward);
                handleAdRewarded();
            }).then(l => rewardListener = l);
        }

        return () => {
            isMounted = false;
            if (rewardListener) rewardListener.remove();
        };
    }, [activeSession]);

    // Handler seguro quando usuário ganha recompensa (assiste o AD até o final)
    const handleAdRewarded = async () => {
        if (!activeSession) return;
        try {
            setLoading(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const { data, error: invokeError } = await supabase.functions.invoke('increment-turbo-step', {
                body: { sessionId: activeSession.id },
                headers: { Authorization: `Bearer ${sessionData?.session?.access_token}` }
            });

            if (invokeError) throw new Error("Falha ao registrar recompensa");

            if (data?.success) {
                setActiveSession(prev => prev ? { ...prev, currentStep: data.currentStep } : null);

                if (data.currentStep >= activeSession.requiredSteps) {
                    alert("🎉 Turbo ativado com sucesso! Seu anúncio agora está em destaque.");
                    onBack();
                } else {
                    // Prepara o próximo anúncio
                    if (Capacitor.isNativePlatform()) {
                        setAdReady(false);
                        await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' });
                        setAdReady(true);
                    }
                }
            } else {
                throw new Error("Resposta inválida do servidor");
            }
        } catch (err) {
            console.error("Erro ao incrementar passo do turbo", err);
            alert("Não foi possível contabilizar o anúncio. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // Handler para disparar o vídeo nativamente ou fallback na web.
    const handleWatchAd = async () => {
        setWatchingAd(true);
        try {
            if (Capacitor.isNativePlatform()) {
                await AdMob.showRewardVideoAd();
            } else {
                // Simulador Web
                alert("Em ambiente WEB o vídeo foi pulado e contabilizado auto-mágicamente para testes.");
                await handleAdRewarded();
            }
        } catch (err) {
            console.error('Erro ao mostrar anuncio', err);
            alert("Erro ao carregar o vídeo. Verifique sua conexão e tente novamente.");
        } finally {
            setWatchingAd(false);
        }
    };


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

    // Criar a sessão 
    const handleSelectPlan = async (planId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão expirada. Faça login novamente.');

            const { data, error: invokeError } = await supabase.functions.invoke('activate-turbo', {
                body: { adId: ad.id, turboType: planId },
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (invokeError) throw new Error('🚀 Você já possui um Turbo em andamento para este anúncio.\nAtualize a página.');
            if (data?.error) throw new Error(data.error);

            if (data?.success && data?.sessionId) {
                setActiveSession({
                    id: data.sessionId,
                    adId: ad.id,
                    requiredSteps: data.requiredSteps || 5, // Fallback safe
                    currentStep: 0
                });
            } else {
                throw new Error('Falha ao iniciar a sessão do Turbo.')
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

                {/* ESTADO 1: Escolha do Plano */}
                {!activeSession && (
                    <>
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
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Escolher Plano</>}
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
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <><Play className="w-5 h-5 fill-current" /> Escolher Plano</>}
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
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Escolher Plano</>}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ESTADO 2: Monitor de Progresso de Anúncios */}
                {activeSession && (
                    <div className="flex flex-col items-center justify-center text-center animate-in fade-in pt-8">
                        <MonitorPlay className="w-20 h-20 text-blue-500 mb-6" />
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Quase lá!</h2>
                        <p className="text-gray-600 mb-8 max-w-[280px]">Assista aos vídeos para completar o impulsionamento do seu anúncio 100% grátis.</p>

                        {/* Progress Bar */}
                        <div className="w-full max-w-[300px] bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
                            <div
                                className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(activeSession.currentStep / activeSession.requiredSteps) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-10">
                            Progresso: <span className="text-blue-600">{activeSession.currentStep}</span> / {activeSession.requiredSteps} anúncios
                        </p>

                        <button
                            onClick={handleWatchAd}
                            disabled={!adReady || watchingAd || loading}
                            className={`w-full max-w-[300px] py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]
                                ${adReady && !watchingAd && !loading
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-blue-500/50'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                            {(watchingAd || loading || !adReady) ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> {(watchingAd || loading) ? "Processando..." : "Carregando Vídeo"}</>
                            ) : (
                                <><Play className="w-5 h-5 fill-current" /> Assistir Anúncio</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
