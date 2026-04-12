import {
    AdMob,
    RewardAdOptions,
    RewardAdPluginEvents,
    AdOptions,
    BannerAdOptions,
    BannerAdPosition,
    BannerAdSize,
    BannerAdPluginEvents,
    InterstitialAdPluginEvents
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { debugLogger } from '../utils/DebugLogger';


export enum AdState {
    IDLE = 'IDLE',
    LOADING = 'LOADING',
    READY = 'READY',
    SHOWING = 'SHOWING',
    ERROR = 'ERROR'
}

type AdEventHandler = () => Promise<void> | void;
type AdErrorHandler = (error: string) => void;

class AdManager {
    private state: AdState = AdState.IDLE;
    private rewardAdId: string = 'ca-app-pub-5881779125246456/1300960298'; // Production ID
    private bannerAdId: string = 'ca-app-pub-5881779125246456/9926525312'; // Production ID
    private interstitialAdId: string = 'ca-app-pub-3940256099942544/1033173712'; // Test ID
    private isInitialized: boolean = false;
    private listenersInitialized: boolean = false; 
    private timeoutId: any = null;
    private TIMEOUT_DURATION = 60000; 
    private PRELOAD_TIMEOUT = 10000; 

    // Diagnostic State
    private adError: { type: string; details: any; timestamp: string } | null = null;
    private adErrorListeners: ((error: any) => void)[] = [];
    private readonly VERSION_INFO = { name: "1.1.5", code: 16 };

    // Banner & Concurrency State
    private isBannerShowing: boolean = false;
    private isBannerLoading: boolean = false;
    private hasInitializedBanner: boolean = false;
    private isAppReady: boolean = false;
    private bannerPromise: Promise<void> = Promise.resolve();
    private isProcessingShow: boolean = false; 
    private lastExecutionId: string = '';
    private isPreloading: boolean = false;

    // Callbacks
    private onReadyCallbacks: AdEventHandler[] = [];
    private onRewardedCallbacks: AdEventHandler[] = [];
    private onDismissedCallbacks: AdEventHandler[] = [];
    private onErrorCallbacks: AdErrorHandler[] = [];
    private bannerListeners: ((showing: boolean) => void)[] = [];

    private constructor() {
        console.log(`[AdDebug] INSTÂNCIA CRIADA. Version: ${this.VERSION_INFO.name} (${this.VERSION_INFO.code})`);
        debugLogger.log(`[AdDebug] INSTÂNCIA CRIADA. Version: ${this.VERSION_INFO.name}`);

        
        if (!(window as any).__admob_global_listeners) {
            (window as any).__admob_global_listeners = 0;
        }

        if (Capacitor.isNativePlatform()) {
            this.setupListeners();
            setTimeout(() => {
                this.isAppReady = true;
                console.log('[AdMob] App Ready Guard activated');
            }, 1000);
        }
    }

    /**
     * Padrão Singleton endurecido: A instância é armazenada no objeto global 'window'
     * para garantir unicidade absoluta mesmo se houver duplicação de bundles JS.
     */
    public static getInstance(): AdManager {
        if (!(window as any).__adManagerInstance) {
            console.log("[AdDebug] Criando instância GLOBAL do AdManager no objeto window");
            (window as any).__adManagerInstance = new AdManager();
        }
        return (window as any).__adManagerInstance;
    }

    private lastRewardTime: number = 0;
    private lastDismissedTime: number = 0;

    private setupListeners() {
        if (this.listenersInitialized) {
            console.log('[AdDebug] setupListeners: listeners already initialized in instance');
            return;
        }

        (window as any).__admob_global_listeners++;
        const globalCount = (window as any).__admob_global_listeners;
        console.log(`[AdDebug] REGISTERING LISTENERS. Global Instance Count: ${globalCount}`);
        debugLogger.log(`[AdDebug] REGISTERING LISTENERS. Count: ${globalCount}`);

        
        if (globalCount > 1) {
            console.error(`[AdDebug] CRITICAL: Multiple AdManager listener registrations detected (${globalCount})!`);
        }

        const handleReward = async (reward: any) => {
            const now = Date.now();
            if (now - this.lastRewardTime < 3000) {
                console.log('[AdDebug] handleReward: Throttled (duplicate)');
                return;
            }
            this.lastRewardTime = now;

            console.log(`[AD FLOW] Reward received (Exec: ${this.lastExecutionId}):`, reward);
            this.clearTimeout();

            console.log(`[AD FLOW] Executing ${this.onRewardedCallbacks.length} reward callbacks`);
            await Promise.all(this.onRewardedCallbacks.map(async (cb, idx) => {
                try {
                    await cb();
                    console.log(`[AD FLOW] Callback ${idx} success`);
                } catch (e) {
                    console.error(`[AD FLOW] Callback ${idx} fail:`, e);
                }
            }));
        };

        const handleDismiss = async () => {
            const now = Date.now();
            if (now - this.lastDismissedTime < 2000) {
                console.log('[AdDebug] handleDismiss: Throttled');
                return;
            }
            this.lastDismissedTime = now;

            console.log(`[AD FLOW] Ad dismissed (Exec: ${this.lastExecutionId})`);
            debugLogger.log(`[AdDebug] Ad dismissed (Exec: ${this.lastExecutionId})`);
            this.state = AdState.IDLE;

            this.clearTimeout();

            console.log(`[AD FLOW] Notifying ${this.onDismissedCallbacks.length} dismiss callbacks`);
            this.onDismissedCallbacks.forEach(cb => {
                try { cb(); } catch (e) { console.error('[AdMob-v8] Dismiss callback fail:', e); }
            });

            console.log(`[AdDebug] RESETTING isProcessingShow from ${this.isProcessingShow} to false (Dismissed)`);
            this.isProcessingShow = false;
            this.preload();
        };


        AdMob.addListener(RewardAdPluginEvents.Loaded, (info: any) => {
            console.log(`[AdDebug] EVENT: Loaded (Exec: ${this.lastExecutionId})`, info);
            if (this.state === AdState.SHOWING) {
                console.log('[AdDebug] Load event ignored while SHOWING');
                return;
            }
            this.state = AdState.READY;
            this.clearTimeout();
            debugLogger.log(`[AdMob] SUCESSO: Vídeo pronto para exibição.`);
            this.onReadyCallbacks.forEach(cb => cb());
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
            console.log(`[AdDebug] EVENT: FailedToLoad (Exec: ${this.lastExecutionId})`, error);
            debugLogger.log(`[AdDebug] FailedToLoad: ${error.message} (Exec: ${this.lastExecutionId})`);
            this.state = AdState.ERROR;

            this.clearTimeout();
            this.handleAdError('FAILED_TO_LOAD', error);
            this.onErrorCallbacks.forEach(cb => cb(error.message));
        });

        AdMob.addListener(RewardAdPluginEvents.Showed, () => {
            console.log(`[AdDebug] EVENT: Showed (Exec: ${this.lastExecutionId})`);
            this.state = AdState.SHOWING;
            this.startShowTimeout();
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
            console.log(`[AdDebug] EVENT: FailedToShow (Exec: ${this.lastExecutionId})`, error);
            debugLogger.log(`[AdDebug] FailedToShow: ${error.message} (Exec: ${this.lastExecutionId})`);
            this.state = AdState.ERROR;

            console.log(`[AdDebug] RESETTING isProcessingShow from ${this.isProcessingShow} to false (FailedToShow)`);
            this.isProcessingShow = false;
            this.clearTimeout();
            this.handleAdError('FAILED_TO_SHOW', error);
            this.onErrorCallbacks.forEach(cb => cb(error.message));
        });

        AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
            console.log(`[AdDebug] EVENT: Rewarded (Exec: ${this.lastExecutionId})`, reward);
            handleReward(reward);
        });

        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            console.log(`[AdDebug] EVENT: Dismissed (Exec: ${this.lastExecutionId})`);
            handleDismiss();
        });

        this.listenersInitialized = true;
    }

    private handleAdError(type: string, details: any) {
        const error = { type, details, timestamp: new Date().toISOString() };
        console.error(`[AdDebug ERROR] (Exec: ${this.lastExecutionId}):`, type, details);
        this.adError = error;
        this.adErrorListeners.forEach(cb => cb(error));
    }

    public getAdError() { return this.adError; }
    public onAdError(cb: (error: any) => void) { this.adErrorListeners.push(cb); }
    public getProcessingShow(): boolean { return this.isProcessingShow; }

    public async initialize(customAdId?: string) {
        console.log(`[AdDebug] initialize() called. Version: ${this.VERSION_INFO.name}`);
        if (customAdId) this.rewardAdId = customAdId;
        try {
            if (Capacitor.isNativePlatform()) {
                if (!this.isInitialized) {
                    await AdMob.initialize();
                    this.isInitialized = true;
                }
                debugLogger.log(`[AdMob] Inicializando Native...`);
                this.setupListeners();
                await this.preload();
                debugLogger.log(`[AdMob] Inicialização Concluída.`);
            } else {
                this.isInitialized = true;
                this.state = AdState.READY;
            }
        } catch (error: any) {
            console.error('[AdMob] Init error:', error);
            this.handleAdError('UNEXPECTED_ERROR', error?.message || error);
        }
    }

    public async preload() {
        if (!Capacitor.isNativePlatform()) return;
        if (this.isPreloading) {
            console.log('[AdDebug] preload() ignored: already preloading');
            return;
        }

        console.log(`[AdDebug] preload() called. State: ${this.state}`);
        this.isPreloading = true;
        this.state = AdState.LOADING;
        try {
            const options: RewardAdOptions = { adId: this.rewardAdId, isTesting: false };
            this.startPreloadTimeout();
            await AdMob.prepareRewardVideoAd(options);
            debugLogger.log('[AdMob] Comando Prepare enviado.');
            console.log('[AdMob] prepareRewardVideoAd resolved');
        } catch (error: any) {
            console.error('[AdMob] Preload error:', error);
            this.handleAdError('FAILED_TO_LOAD', error?.message || error);
            this.state = AdState.ERROR;
            this.clearTimeout();
        } finally {
            this.isPreloading = false;
        }
    }

    public async show(): Promise<boolean> {
        const executionId = `EX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.lastExecutionId = executionId;
        console.log(`[AdDebug] [SHOW CALL] ID: ${executionId} | State: ${this.state}`);

        // 🔍 REMOÇÃO TEMPORÁRIA DE TRAVAS INTERNAS PARA DEBUG
        /*
        if (this.isProcessingShow) {
            console.warn(`🔥 [AdDebug] [BLOQUEIO] Ad show already in progress (Exec: ${executionId})`);
            return false;
        }

        if (this.state === AdState.SHOWING) {
            console.warn(`🔥 [AdDebug] [BLOQUEIO] Already showing (Exec: ${executionId})`);
            return false;
        }
        */

        this.isProcessingShow = true;

        if (!Capacitor.isNativePlatform()) {
            debugLogger.log(`[AdMob Web] Simulando abertura de anúncio (Mock)...`);
            console.log(`[AdMob Web] Mock Show (Exec: ${executionId})`);
            setTimeout(() => {
                debugLogger.log(`[AdMob Web] Recompensa recebida!`);
                this.onRewardedCallbacks.forEach(cb => cb());
                this.isProcessingShow = false;
                debugLogger.log(`[AdMob Web] Painel fechado.`);
                this.onDismissedCallbacks.forEach(cb => cb());
            }, 1000);
            return true;
        }

        if (this.state !== AdState.READY) {
            console.warn(`🔥 [AdDebug] [BLOQUEIO] Show aborted: Not Ready (State: ${this.state}, Exec: ${executionId})`);
            debugLogger.log(`🔥 [AdDebug] [BLOQUEIO] Ad não está pronto (State: ${this.state})`);
            this.handleAdError('AD_NOT_READY', { currentState: this.state, executionId });
            this.isProcessingShow = false; 
            await this.preload();
            return false;
        }

        await this.executeShowDirectly(executionId);
        return true;
    }

    private async executeShowDirectly(executionId: string) {
        try {
            console.log(`[AdDebug] CRITICAL: Calling AdMob.showRewardVideoAd() (Exec: ${executionId})`);
            await AdMob.showRewardVideoAd();
            console.log(`[AdDebug] showRewardVideoAd resolved (Exec: ${executionId})`);
        } catch (error: any) {
            console.error(`[AdDebug] showRewardVideoAd error (Exec: ${executionId}):`, error);
            this.handleAdError('FAILED_TO_SHOW', error?.message || error);
            this.state = AdState.ERROR;
            this.isProcessingShow = false; 
        }
    }

    private startPreloadTimeout() {
        this.clearTimeout();
        this.timeoutId = setTimeout(() => {
            if (this.state === AdState.LOADING) {
                this.state = AdState.ERROR;
                this.handleAdError('TIMEOUT_NO_EVENT', 'Preload timeout');
                this.onErrorCallbacks.forEach(cb => cb("Timeout ao carregar anúncio"));
            }
        }, this.PRELOAD_TIMEOUT);
    }

    private startShowTimeout() {
        this.clearTimeout();
        this.timeoutId = setTimeout(() => {
            if (this.state === AdState.SHOWING) {
                this.state = AdState.IDLE;
                this.isProcessingShow = false;
                this.onDismissedCallbacks.forEach(cb => cb());
            }
        }, this.TIMEOUT_DURATION);
    }

    private clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    public isAdReady(): boolean { return this.state === AdState.READY; }
    public onReady(cb: AdEventHandler) { this.onReadyCallbacks.push(cb); }
    public onRewarded(cb: AdEventHandler) { this.onRewardedCallbacks.push(cb); }
    public onDismissed(cb: AdEventHandler) { this.onDismissedCallbacks.push(cb); }
    public onError(cb: AdErrorHandler) { this.onErrorCallbacks.push(cb); }

    public removeAllListeners() {
        console.log('[AdDebug] removeAllListeners() (JS cleared)');
        this.onReadyCallbacks = [];
        this.onRewardedCallbacks = [];
        this.onDismissedCallbacks = [];
        this.onErrorCallbacks = [];
    }

    // --- BANNER METHODS ---
    public onBannerStateChange(cb: (showing: boolean) => void) { 
        this.bannerListeners.push(cb);
        cb(this.isBannerShowing);
    }
    private notifyBannerListeners() { this.bannerListeners.forEach(cb => cb(this.isBannerShowing)); }
    public isBannerActive(): boolean { return this.isBannerShowing; }

    public async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER) {
        if (!Capacitor.isNativePlatform()) return;
        this.bannerPromise = this.bannerPromise.then(async () => {
            if (this.hasInitializedBanner || this.isBannerShowing || this.isBannerLoading) return;
            if (!this.isAppReady || document.visibilityState !== 'visible') return;

            this.isBannerLoading = true;
            try {
                const options: BannerAdOptions = {
                    adId: this.bannerAdId,
                    adSize: BannerAdSize.ADAPTIVE_BANNER,
                    position: position,
                    margin: 0,
                    isTesting: false 
                };
                await Promise.race([
                    AdMob.showBanner(options),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
                ]);
                this.isBannerShowing = true;
                this.notifyBannerListeners();
                this.hasInitializedBanner = true;
            } catch (error) {
                console.error('[AdMob] Banner error:', error);
            } finally {
                this.isBannerLoading = false;
            }
        });
        return this.bannerPromise;
    }

    public async removeBanner() {
        if (!Capacitor.isNativePlatform()) return;
        this.bannerPromise = this.bannerPromise.then(async () => {
            try {
                await AdMob.removeBanner();
                this.isBannerShowing = false;
                this.notifyBannerListeners();
                this.hasInitializedBanner = false;
            } catch (error) {}
        });
        return this.bannerPromise;
    }

    public async hideBanner() {
        if (!Capacitor.isNativePlatform()) return;
        this.bannerPromise = this.bannerPromise.then(() => AdMob.hideBanner().catch(() => {}));
        return this.bannerPromise;
    }

    public async resumeBanner() {
        if (!Capacitor.isNativePlatform()) return;
        this.bannerPromise = this.bannerPromise.then(() => AdMob.resumeBanner().catch(() => {}));
        return this.bannerPromise;
    }

    public async showInterstitial() {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await AdMob.prepareInterstitial({ adId: this.interstitialAdId, isTesting: false });
            await AdMob.showInterstitial();
        } catch (error) {}
    }
}

export default AdManager;
