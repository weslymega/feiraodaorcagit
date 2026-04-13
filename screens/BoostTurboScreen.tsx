import React, { useState, useEffect, useRef } from 'react';
import { AdItem } from '../types';
import { api, supabase } from '../services/api';
import { Header } from '../components/Shared';
import { Play, Loader2, Zap, Star, ShieldAlert, MonitorPlay, Rocket, Info, Bug, ArrowLeft } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import AdManager from '../services/AdManager';
import { turboService } from '../services/turboService';
import { debugLogger } from '../utils/DebugLogger';
import DebugPanel from '../components/DebugPanel';

const adManager = AdManager.getInstance();

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
    const [localProgress, setLocalProgress] = useState(0); 
    const [adReady, setAdReady] = useState(false);
    const [watchingAd, setWatchingAd] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const finalizingRef = useRef(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [loadingTextIndex, setLoadingTextIndex] = useState(0);
    const [adError, setAdError] = useState<{ type: string; details: any; timestamp: string } | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [isProgressiveMode, setIsProgressiveMode] = useState(false);
    const isClickLocked = useRef(false);

    const finalizationTexts = [
        "Verificando recompensa...",
        "Aplicando destaque...",
        "Quase pronto..."
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isFinalizing && !showSuccess) {
            setLoadingTextIndex(0);
            interval = setInterval(() => {
                setLoadingTextIndex(prev => (prev + 1) % finalizationTexts.length);
            }, 1500);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isFinalizing, showSuccess]);

    const sessionRef = useRef(activeSession);
    const onBackRef = useRef(onBack);
    const handlersRef = useRef({
        handleRewarded: async () => { },
        handleDismissed: () => { }
    });

    useEffect(() => {
        sessionRef.current = activeSession;
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
                const fetchedAd = await api.getAdById(adId);
                if (isMounted) setAd(fetchedAd as AdItem);

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
                            requiredSteps: turboSession.required_steps || turboSession.required_ads || 5,
                            currentStep: turboSession.current_step || turboSession.watched_ads || 0
                        };
                        setActiveSession(sess);
                        sessionRef.current = sess;
                        setIsProgressiveMode(false);
                    } else {
                        setIsProgressiveMode(true);
                        setLocalProgress(fetchedAd.turbo_progress || 0);
                    }
                } else {
                    setIsProgressiveMode(true);
                }
            } catch (err) {
                console.error('Failed to load ad details:', err);
                if (isMounted) setAd(null);
            } finally {
                if (isMounted) setLoadingAd(false);
            }
        };
        fetchAdAndSession();
        return () => { isMounted = false; };
    }, [adId]);

    useEffect(() => {
        finalizingRef.current = isFinalizing;
    }, [isFinalizing]);

    const handleAdRewardedInternal = async (): Promise<void> => {
        console.log("🔥 [BoostTurboScreen] AD REWARDED EVENT RECEIVED! Starting Supabase update...");
        if (finalizingRef.current) {
            console.log("⚠️ [BoostTurboScreen] handleAdRewardedInternal ignored: already finalizing");
            return;
        }

        if (isProgressiveMode) {
            setSyncError(null);
            try {
                setLocalProgress(prev => prev + 1);
                const result = await turboService.applyTurboReward(ad!.id);
                if (!result.success) throw new Error(result.error || "Falha ao aplicar recompensa.");
                if (ad) {
                    setAd({ ...ad, turbo_progress: result.turbo_progress, turbo_expires_at: result.turbo_expires_at, is_turbo_active: true });
                }
                setIsFinalizing(true);
                finalizingRef.current = true;
                setTimeout(async () => {
                    if (Capacitor.isNativePlatform()) {
                        await Haptics.notification({ type: NotificationType.Success }).catch(err => console.log('Haptics ignore:', err));
                    }
                    setShowSuccess(true);
                    setTimeout(() => onBackRef.current(), 2500);
                }, 2000);
            } catch (err: any) {
                console.error("[BoostTurboScreen] Reward Error:", err);
                setSyncError(err.message || "Erro de sincronização");
                setLocalProgress(ad?.turbo_progress || 0);
                throw err;
            }
            return;
        }

        const currentSession = sessionRef.current;
        if (!currentSession) return;

        setSyncError(null);
        try {
            setLocalProgress(prev => prev + 1);
            const data = await api.safeRequest(async (token) => {
                const { data, error: invokeError } = await supabase.functions.invoke('increment-turbo-step', {
                    body: { sessionId: currentSession.id },
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (invokeError) throw invokeError;
                return data;
            });

            if (!data?.success) throw new Error(data?.error || "Servidor não confirmou.");
            const newStep = data?.current_step ?? data?.currentStep;
            if (newStep !== undefined) {
                setActiveSession(prev => prev ? { ...prev, currentStep: newStep } : null);
                if (data?.turbo_activated) {
                    setIsFinalizing(true);
                    finalizingRef.current = true;
                    setTimeout(async () => {
                        if (Capacitor.isNativePlatform()) {
                            await Haptics.notification({ type: NotificationType.Success }).catch(err => console.log('Haptics ignore:', err));
                        }
                        setShowSuccess(true);
                        setTimeout(() => onBackRef.current(), 2500);
                    }, 3000);
                }
            }
        } catch (err: any) {
            if (finalizingRef.current) return;
            setSyncError(err.message || "Erro de rede");
            throw err;
        }
    };

    handlersRef.current = {
        handleRewarded: handleAdRewardedInternal,
        handleDismissed: () => {
            setWatchingAd(false);
            isClickLocked.current = false;
            setAdReady(adManager.isAdReady());
        }
    };

    useEffect(() => {
        if (!isProgressiveMode && !activeSession?.id) return;
        adManager.initialize();
        adManager.onReady(() => setAdReady(adManager.isAdReady()));
        adManager.onAdError((err) => { setAdError(err); setWatchingAd(false); });
        adManager.onRewarded(async () => await handlersRef.current.handleRewarded());
        adManager.onDismissed(() => handlersRef.current.handleDismissed());
        adManager.onError(() => { setWatchingAd(false); isClickLocked.current = false; setIsFinalizing(false); });
        return () => adManager.removeAllListeners();
    }, [activeSession?.id, isProgressiveMode, adId]);

    const handleWatchAd = async () => {
        console.log("BOTÃO CLICADO (via handleWatchAd)");
        try {
            const currentSession = sessionRef.current;
            if (!isProgressiveMode && !currentSession) {
                console.log("🚫 RETURN: Sem sessão ativa");
                return;
            }
            setWatchingAd(true);
            setSyncError(null);
            setAdError(null);
            console.log("ANTES DO SHOW (via handleWatchAd)");
            const success = await adManager.show();
            console.log("DEPOIS DO SHOW (via handleWatchAd) | Resultado:", success);
        } catch (e) {
            console.error("❌ ERRO NO FLUXO:", e);
        } finally {
            isClickLocked.current = false;
            setWatchingAd(false);
        }
    };

    const handleDebugAdFlow = async () => {
        setShowDebug(true);
        debugLogger.clear();
        debugLogger.log("--- TESTE MANUAL ---");
        setWatchingAd(true);
        try {
            await adManager.initialize();
            await adManager.preload();
            if (adManager.isAdReady()) await adManager.show();
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

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
            <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white border-b border-gray-100 shadow-sm relative z-10">
                <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 active:scale-90 transition-all border border-gray-100">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Boost Turbo {isProgressiveMode ? "⚡" : ""}</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Acelerador de Resultados</p>
                </div>
                <button onClick={() => setShowDebug(!showDebug)} className="ml-auto p-2 text-gray-300 hover:text-gray-900">
                  <Bug className="w-4 h-4" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-8 scrolling-touch">
                {showDebug && <div className="mb-6"><DebugPanel /></div>}

                {isProgressiveMode && (
                    <div className="animate-in fade-in slide-in-from-bottom duration-500 text-center">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-2xl shadow-blue-500/5 mb-8 relative overflow-hidden group">
                            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-blue-600/40 rotate-3 transition-transform group-hover:rotate-0">
                                <Zap className="w-10 h-10 text-white fill-current" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 leading-none mb-3">Turbo <span className="text-blue-600 italic">Boost</span></h1>
                            <p className="text-sm text-gray-500 font-bold leading-relaxed max-w-[240px] mx-auto">
                                Assista vídeos curtos para destacar seu anúncio no topo.
                            </p>

                            <div className="mt-10 relative z-10">
                                <div className="flex justify-between items-end mb-3 px-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível de Destaque</span>
                                    <span className="text-lg font-black text-blue-600 italic">{(localProgress / 3 * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-6 bg-gray-100 rounded-full p-1 border border-gray-50 shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min((localProgress / 3) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl mb-6">
                            <button
                                onClick={async () => {
                                    console.log("CLICK DIRETO");
                                    console.log("ANTES DO SHOW");
                                    const success = await adManager.show();
                                    console.log("DEPOIS DO SHOW | Sucesso:", success);
                                }}
                                className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] bg-gray-900 text-white`}
                            >
                                <Play className="w-6 h-6 fill-current" /> Assistir (CLICK DIRETO)
                            </button>
                        </div>
                    </div>
                )}
                
                {activeSession && (
                    <div className="animate-in fade-in flex flex-col items-center text-center pt-8">
                        <MonitorPlay className="w-20 h-20 text-blue-500 mb-6" />
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Quase lá!</h2>
                        <div className="w-full max-w-[300px] bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
                            <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${(localProgress / activeSession.requiredSteps) * 100}%` }}></div>
                        </div>
                        <button
                            onClick={async () => {
                                console.log("CLICK DIRETO (Sessão)");
                                console.log("ANTES DO SHOW");
                                await adManager.show();
                                console.log("DEPOIS DO SHOW");
                            }}
                            className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] bg-blue-600 text-white shadow-blue-500/30`}
                        >
                            <Play className="w-6 h-6 fill-current" /> Assistir Anúncio (CLICK DIRETO)
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};
