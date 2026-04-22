import React, { useState, useEffect, useRef } from 'react';
import { AdItem } from '../types';
import { api, supabase } from '../services/api';
import { Header } from '../components/Shared';
import { Play, Loader2, Zap, Star, ShieldAlert, MonitorPlay, Rocket, Info, Bug, ArrowLeft, CheckCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import AdManager from '../services/AdManager';
import { turboService } from '../services/turboService';
import { debugLogger } from '../utils/DebugLogger';
import { useAppState } from '../hooks/useAppState';
import { useAppActions } from '../hooks/useAppActions';
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

    const state = useAppState();
    const actions = useAppActions(state);

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
    const [lastReward, setLastReward] = useState<any>(null);
    const [showRulesModal, setShowRulesModal] = useState(false);
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

    const handleAdRewardedInternal = async (rewardId?: string): Promise<void> => {
        debugLogger.log(`🔥 [BoostTurboScreen] EVENTO RECOMPENSA RECEBIDO! (ID: ${rewardId})`);
        console.log(`🔥 [BoostTurboScreen] AD REWARDED EVENT RECEIVED! (ID: ${rewardId})`);
        if (finalizingRef.current) {
            console.log("⚠️ [BoostTurboScreen] handleAdRewardedInternal ignored: already finalizing");
            return;
        }

        if (isProgressiveMode) {
            setSyncError(null);
            try {
                const selectedAdId = ad!.id;

                debugLogger.log('📡 Chamando turboService.applyTurboReward');
                setLocalProgress(prev => prev + 1);

                const data = await turboService.applyTurboReward(selectedAdId, rewardId);

                if (!data.success) {
                    throw new Error(data.error || 'Erro ao aplicar recompensa');
                }

                if (ad) {
                    const updatedAd = { 
                        ...ad, 
                        turbo_progress: data.turbo_progress, 
                        turbo_expires_at: data.turbo_expires_at, 
                        is_turbo_active: true,
                        // Consistência: Usamos o expires_at como parte da versão se o updated_at do banco não estiver disponível
                        syncVersion: data.turbo_expires_at 
                    };
                    setAd(updatedAd);

                    // --- HARDENING: Sincronização Global Determinística ---
                    actions.handleSyncAdUpdate(updatedAd, 'manual');
                }
                
                setLocalProgress(data.turbo_progress);
                setLastReward(data);
                setIsFinalizing(true);
                finalizingRef.current = true;

                setTimeout(async () => {
                    if (Capacitor.isNativePlatform()) {
                        await Haptics.notification({ type: NotificationType.Success }).catch(err => console.log('Haptics ignore:', err));
                    }
                    setShowSuccess(true);
                    
                    // Reset visual após 6 segundos para permitir ler todas as informações
                    setTimeout(() => {
                        setShowSuccess(false);
                        setIsFinalizing(false);
                        finalizingRef.current = false;
                    }, 6000);
                }, 1500);
            } catch (err: any) {
                console.error(err);
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
            debugLogger.log('📡 Chamando increment-turbo-step');
            setLocalProgress(prev => prev + 1);
            const data = await api.safeRequest(async (token) => {
                const { data, error: invokeError } = await supabase.functions.invoke('increment-turbo-step', {
                    body: { sessionId: currentSession.id, rewardId },
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (invokeError) throw invokeError;
                return data;
            });

            if (!data?.success) throw new Error(data?.error || "Servidor não confirmou.");
            debugLogger.log('✅ Passo do Turbo confirmado');
            const newStep = data?.current_step ?? data?.currentStep;
            if (newStep !== undefined) {
                setActiveSession(prev => prev ? { ...prev, currentStep: newStep } : null);
                if (data?.turbo_activated) {
                    setLastReward({ turbo_progress: 3, turbo_activated: true }); // Mock para o overlay de sucesso mostrar nível máximo
                    setIsFinalizing(true);
                    finalizingRef.current = true;
                    setTimeout(async () => {
                        if (Capacitor.isNativePlatform()) {
                            await Haptics.notification({ type: NotificationType.Success }).catch(err => console.log('Haptics ignore:', err));
                        }
                        setShowSuccess(true);
                        
                        // Reset visual após 6 segundos (padrão unificado)
                        setTimeout(() => {
                            setShowSuccess(false);
                            setIsFinalizing(false);
                            finalizingRef.current = false;
                            onBackRef.current(); // No modo sessão, voltamos após completar
                        }, 6000);
                    }, 1500);
                }
            }
        } catch (err: any) {
            debugLogger.log(`❌ Erro: ${err.message || 'Falha no Turbo'}`);
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
        
        // --- ETAPA 3: REGISTRO DIRETO (SEM DEPENDER APENAS DE REF) ---
        const callback = async (rewardId?: string) => {
            console.log(`🔥 RECOMPENSA NA UI (Callback Direto com ID: ${rewardId})`);
            try {
                await handleAdRewardedInternal(rewardId);
            } catch (err) {
                console.error('Erro ao processar callback de recompensa:', err);
            }
        };

        adManager.onRewarded(callback);
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



    // Auxiliar para cores e nomes de níveis dinâmicos
    const getLevelData = (progress: number) => {
        if (progress >= 3) return { name: "Turbo Máximo 🔥", color: "from-orange-500 to-red-600", bg: "bg-orange-50", text: "text-orange-600", badge: "bg-orange-100 border-orange-200" };
        if (progress === 2) return { name: "Nível PRO ⚡", color: "from-indigo-500 to-purple-600", bg: "bg-indigo-50", text: "text-indigo-600", badge: "bg-indigo-100 border-indigo-200" };
        if (progress === 1) return { name: "Nível PREMIUM ✨", color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 border-blue-200" };
        return { name: "Aguardando Boost", color: "from-gray-400 to-gray-500", bg: "bg-gray-50", text: "text-gray-400", badge: "bg-gray-100 border-gray-200" };
    };

    const currentLevel = getLevelData(localProgress);

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
            <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white border-b border-gray-100 shadow-sm relative z-10">
                <button onClick={onBack} className="w-10 h-10 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 active:scale-90 transition-all border border-gray-100">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-black text-gray-900 uppercase tracking-tighter truncate">Boost Turbo {isProgressiveMode ? "⚡" : ""}</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Acelerador de Resultados</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Botão de Debug: visível apenas no ambiente de desenvolvimento */}
                    {import.meta.env.DEV && (
                        <button 
                            onClick={handleDebugAdFlow}
                            className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all border border-gray-100"
                            title="Debug Ad Flow"
                        >
                            <Bug className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={() => setShowRulesModal(true)}
                        className="h-10 px-4 rounded-xl bg-blue-600 flex items-center gap-2 text-white active:scale-95 transition-all shadow-lg shadow-blue-500/30 border border-blue-500 whitespace-nowrap"
                    >
                        <Info className="w-4 h-4 fill-white/20 flex-shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-tight">Como funciona?</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-8 scrolling-touch">
                {showDebug && <div className="mb-6"><DebugPanel /></div>}

                {/* UI UNIFICADA DE PROGRESSÃO (Suporta Modo Progressivo e Sessões Legadas) */}
                {(isProgressiveMode || activeSession) && (
                    <div className="animate-in fade-in slide-in-from-bottom duration-500 text-center">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-2xl shadow-blue-500/5 mb-8 relative overflow-hidden group">
                            
                            {/* Novo Badge de Nível Dinâmico */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${currentLevel.badge} ${currentLevel.text} mb-6 animate-bounce`}>
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span className="text-[11px] font-black uppercase tracking-widest leading-none">{currentLevel.name}</span>
                            </div>

                            <div className={`w-20 h-20 shadow-2xl rounded-[2rem] mx-auto flex items-center justify-center mb-6 rotate-3 transition-transform group-hover:rotate-0 bg-gradient-to-br ${currentLevel.color}`}>
                                <Zap className="w-10 h-10 text-white fill-current" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 leading-none mb-3">Turbo <span className="text-blue-600 italic">Boost</span></h1>
                            <p className="text-sm text-gray-500 font-bold leading-relaxed max-w-[240px] mx-auto">
                                Assista vídeos curtos para destacar seu anúncio no topo.
                            </p>
                            
                            <button 
                                onClick={() => setShowRulesModal(true)}
                                className="mt-2 text-[10px] text-blue-600 font-black uppercase tracking-widest hover:underline flex items-center justify-center gap-1"
                            >
                                <Info className="w-3 h-3" /> Ver regras do Turbo
                            </button>

                            <div className="mt-10 relative z-10">
                                <div className="flex justify-between items-end mb-3 px-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{currentLevel.name}</span>
                                    <span className={`text-lg font-black italic ${currentLevel.text}`}>
                                        {(localProgress / (activeSession?.requiredSteps || 3) * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-6 bg-gray-100 rounded-full p-1 border border-gray-50 shadow-inner">
                                    <div 
                                        className={`h-full bg-gradient-to-r ${currentLevel.color} rounded-full transition-all duration-1000 shadow-lg`} 
                                        style={{ width: `${Math.min((localProgress / (activeSession?.requiredSteps || 3)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl mb-6">
                            <button
                                disabled={watchingAd}
                                onClick={async () => {
                                    console.log("CLICK DIRETO");
                                    setWatchingAd(true);
                                    setSyncError(null);
                                    setAdError(null);
                                    try {
                                        console.log("ANTES DO SHOW");
                                        const success = await adManager.show();
                                        console.log("DEPOIS DO SHOW | Sucesso:", success);
                                        if (!success) setWatchingAd(false);
                                    } catch (err) {
                                        console.error("Erro no clique direto:", err);
                                        setWatchingAd(false);
                                    }
                                }}
                                className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] ${watchingAd ? 'bg-gray-400 opacity-70' : 'bg-blue-600 text-white shadow-blue-500/30'}`}
                            >
                                {watchingAd ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Preparando anúncio...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-6 h-6 fill-current" /> Assistir e Ganhar Boost 🎬
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL DE REGRAS */}
            {showRulesModal && (
                <div className="absolute inset-0 z-[2000] bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full bg-white rounded-[2.5rem] p-8 animate-in zoom-in duration-500 shadow-2xl max-h-[85vh] overflow-y-auto relative">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 rotate-3">
                                <Zap className="w-6 h-6 text-white fill-current" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 italic">Turbo Progressivo 📈</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Entenda como funciona</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            {[
                                { level: "1º Vídeo", name: "PREMIUM", gain: "+1 Dia", color: "text-blue-600", bg: "bg-blue-50" },
                                { level: "2º Vídeo", name: "PRO", gain: "+3 Dias", color: "text-indigo-600", bg: "bg-indigo-50" },
                                { level: "3º+ Vídeos", name: "MAX (TOP)", gain: "+7 Dias", color: "text-orange-600", bg: "bg-orange-50" }
                            ].map((row, idx) => (
                                <div key={idx} className={`${row.bg} rounded-2xl p-4 flex items-center justify-between border border-white/50 shadow-sm transition-transform active:scale-[0.98]`}>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">{row.level}</span>
                                        <span className={`text-sm font-black italic ${row.color}`}>{row.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5 text-right">Tempo Ganho</span>
                                        <span className={`text-sm font-black ${row.color}`}>{row.gain}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 italic">
                            <p className="text-xs text-gray-500 font-bold leading-relaxed">
                                💡 <span className="text-gray-900">O tempo é acumulativo!</span> Se você já tem destaque ativo, os novos dias são somados ao tempo restante.
                            </p>
                        </div>

                        <button 
                            onClick={() => setShowRulesModal(false)}
                            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
                        >
                            ENTENDI, VAMOS LÁ!
                        </button>
                    </div>
                </div>
            )}

            {/* OVERLAY DE PROCESSAMENTO */}
            {isFinalizing && !showSuccess && (
                <div className="absolute inset-0 z-[1500] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                        {finalizationTexts[loadingTextIndex]}
                    </h2>
                    <p className="text-gray-500 font-medium">Não feche o aplicativo...</p>
                </div>
            )}

            {/* OVERLAY DE SUCESSO E FEEDBACK */}
            {showSuccess && (
                <div 
                    onClick={() => {
                        setShowSuccess(false);
                        setIsFinalizing(false);
                        finalizingRef.current = false;
                    }}
                    className="absolute inset-0 z-[1600] bg-blue-600 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500 cursor-pointer"
                >
                    <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce">
                        <CheckCircle className="w-14 h-14 text-white" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-4 leading-none">
                        {lastReward?.turbo_progress >= 3 ? "TURBO MÁXIMO!" : "VALEU! +1 BOOST"}
                    </h2>

                    <div className="space-y-4 mb-10">
                        <p className="text-xl font-bold text-blue-50 leading-tight">
                            {lastReward?.turbo_progress < 3 && "🚀 Seu anúncio começou a subir no ranking!"}
                            {lastReward?.turbo_progress === 1 && "✨ Você atingiu o Nível PREMIUM!"}
                            {lastReward?.turbo_progress === 2 && "⚡ Você atingiu o Nível PRO!"}
                            {lastReward?.turbo_progress >= 3 && "👑 TURBO MÁXIMO ATIVADO!"}
                        </p>
                        
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                            <p className="text-sm font-bold text-white mb-1">
                                🚀 Seu anúncio já está sendo impulsionado!
                            </p>
                            <p className="text-xs text-blue-100 italic">
                                ⏱️ Pode levar alguns segundos para aparecer no topo.
                            </p>
                        </div>
                    </div>

                    {lastReward?.turbo_progress < 3 && (
                        <div className="animate-pulse bg-yellow-400 text-blue-900 px-6 py-3 rounded-full font-black text-sm uppercase tracking-tighter">
                            🎯 Assista mais vídeos para aumentar o destaque!
                        </div>
                    )}
                    
                    <div className="mt-12 text-blue-200 text-[10px] font-bold uppercase tracking-widest">
                        Sincronizando com o servidor...
                    </div>
                </div>
            )}
        </div>
    );
};
