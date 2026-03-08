import React, { useState, useEffect, useRef } from 'react';
import { AdItem } from '../types';
import { api, supabase } from '../services/api';
import { Header } from '../components/Shared';
import { Play, Loader2, Zap, Star, ShieldAlert, MonitorPlay } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import AdManager from '../services/AdManager';

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
    const [localProgress, setLocalProgress] = useState(0); // Progresso otimista (AdManager local)
    const [adReady, setAdReady] = useState(false);
    const [watchingAd, setWatchingAd] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    // Refs para manter listeners estáveis e acessar estado atualizado sem re-registrar
    const sessionRef = useRef(activeSession);
    const onBackRef = useRef(onBack);
    // Ref para evitar closures presas nos listeners de eventos globais
    const handlersRef = useRef({
        handleRewarded: async () => { },
        handleDismissed: () => { },
        handleCompleted: () => { }
    });

    useEffect(() => {
        sessionRef.current = activeSession;
        // Sempre que o banco atualizar, sincronizamos o progresso otimista
        if (activeSession) {
            setLocalProgress(prev => Math.max(prev, activeSession.currentStep));
        }
    }, [activeSession]);

    useEffect(() => {
        onBackRef.current = onBack;
    }, [onBack]);

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
                        const sess = {
                            id: turboSession.id,
                            adId: turboSession.ad_id,
                            requiredSteps: turboSession.required_steps || 5,
                            currentStep: turboSession.current_step || 0
                        };
                        setActiveSession(sess);
                        sessionRef.current = sess;
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

    const handleAdRewardedInternal = async (): Promise<void> => {
        const currentSession = sessionRef.current;
        if (!currentSession) {
            console.error("[BoostTurboScreen] Reward sync skipped: No active session ref");
            return;
        }

        console.log(`[BoostTurboScreen] START REWARD SYNC for ${currentSession.id} (Counter: ${localProgress + 1})`);
        setSyncError(null);

        try {
            // 1. Otimismo Imediato (Visual)
            setLocalProgress(prev => prev + 1);

            // 2. Chamada ao Servidor
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) throw new Error("Sessão expirada. Refaça o login.");

            const { data, error: invokeError } = await supabase.functions.invoke('increment-turbo-step', {
                body: { sessionId: currentSession.id },
                headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
            });

            if (invokeError) throw invokeError;
            if (!data?.success) throw new Error(data?.error || "Servidor não confirmou.");

            const newStep = data?.current_step ?? data?.currentStep;

            if (newStep !== undefined) {
                console.log(`[BoostTurboScreen] SYNC SUCCESS! DB Step: ${newStep}/${currentSession.requiredSteps}`);

                // Atualizamos a sessão real com o dado que veio do banco
                setActiveSession(prev => prev ? { ...prev, currentStep: newStep } : null);

                // Se completou, marcamos finalização
                if (newStep >= currentSession.requiredSteps) {
                    setIsFinalizing(true);
                }
            }
        } catch (err: any) {
            console.error("[BoostTurboScreen] SYNC ERROR:", err);
            const msg = err.message || "Erro de rede";
            setSyncError(msg);

            // Em caso de erro, mostramos um alerta sonoro/visual forçado no celular
            if (Capacitor.isNativePlatform()) {
                window.alert(`⚠️ ERRO DE SINCRONIZAÇÃO:\n${msg}\n\nO progresso pode não ter sido salvo no banco.`);
            }
            throw err; // Repassa para o AdManager gerenciar
        }
    };

    // Ref com handlers atualizados para evitar closures presas em listeners de 1x
    handlersRef.current = {
        handleRewarded: handleAdRewardedInternal,
        handleDismissed: () => {
            console.log("[AdMob-v8] UI: Dismiss received");
            setWatchingAd(false);
            setAdReady(AdManager.isAdReady());
        },
        handleCompleted: () => {
            console.log("[AdMob-v8] UI: Queue Completed");
            setIsFinalizing(true);
            setWatchingAd(true);

            // Pequeno delay para garantir que o último setLocalProgress e setActiveSession rodaram
            setTimeout(() => {
                const current = sessionRef.current;
                const prog = localProgressRef.current; // Usar ref para valor mais atual se necessário

                if (current && (current.currentStep >= current.requiredSteps || prog >= current.requiredSteps)) {
                    alert("🎉 Tudo pronto! Seu anúncio agora já está turbinado e em destaque.");
                    onBackRef.current();
                } else {
                    console.warn("[BoostTurboScreen] Queue finished but progress check failed", { db: current?.currentStep, local: prog });
                }
            }, 1500);
        }
    };

    const localProgressRef = useRef(localProgress);
    useEffect(() => { localProgressRef.current = localProgress; }, [localProgress]);

    // Registro dos Listeners no Ciclo de Vida do AdId
    useEffect(() => {
        if (!activeSession?.id) return;

        console.log("[BoostTurboScreen] Initializing AdManager for session:", activeSession.id);
        AdManager.initialize();

        AdManager.onReady(() => setAdReady(AdManager.isAdReady()));

        // Listener de Recompensa (Aguardado pelo AdManager)
        AdManager.onRewarded(async () => {
            console.log("[BoostTurboScreen] Raw onRewarded triggered");
            await handlersRef.current.handleRewarded();
        });

        AdManager.onDismissed(() => handlersRef.current.handleDismissed());
        AdManager.onCompleted(() => handlersRef.current.handleCompleted());

        AdManager.onError((err) => {
            console.error("[BoostTurboScreen] Ad Error:", err);
            setWatchingAd(false);
            setIsFinalizing(false);
        });

        return () => {
            console.log("[BoostTurboScreen] Destroying ad listeners");
            AdManager.removeAllListeners();
        };
    }, [activeSession?.id]);

    const handleWatchAd = async () => {
        const currentSession = sessionRef.current;
        if (!currentSession || watchingAd) return;

        setWatchingAd(true);
        setSyncError(null);
        setLocalProgress(currentSession.currentStep);

        console.log("[BoostTurboScreen] START AD QUEUE from step:", currentSession.currentStep);
        AdManager.startAdQueue(currentSession.requiredSteps, currentSession.currentStep);
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
                        {isFinalizing ? (
                            <>
                                <Loader2 className="w-20 h-20 text-blue-500 animate-spin mb-6" />
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Finalizando Turbo...</h2>
                                <p className="text-gray-600 mb-8 max-w-[280px]">Sincronizando sua recompensa final com o servidor. Quase pronto!</p>
                            </>
                        ) : (
                            <>
                                <MonitorPlay className="w-20 h-20 text-blue-500 mb-6" />
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Quase lá!</h2>
                                <p className="text-gray-600 mb-8 max-w-[280px]">Assista aos vídeos para completar o impulsionamento do seu anúncio 100% grátis.</p>

                                {/* Progress Bar - Usa localProgress para feedback instantâneo */}
                                <div className="w-full max-w-[300px] bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${(localProgress / activeSession.requiredSteps) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm font-bold text-gray-800 mb-4">
                                    Progresso: <span className="text-blue-600">{localProgress}</span> / {activeSession.requiredSteps} anúncios
                                </p>

                                {syncError && (
                                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold animate-in fade-in slide-in-from-top-1">
                                        ⚠️ {syncError}
                                        <button
                                            onClick={handleAdRewardedInternal}
                                            className="ml-2 underline uppercase tracking-tighter"
                                        >
                                            Tentar Sincronizar Agora
                                        </button>
                                    </div>
                                )}

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
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
