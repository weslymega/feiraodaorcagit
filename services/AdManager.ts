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
    private static instance: AdManager;
    private state: AdState = AdState.IDLE;
    private rewardAdId: string = 'ca-app-pub-5881779125246456/1300960298'; // Production ID
    private bannerAdId: string = 'ca-app-pub-5881779125246456/9926525312'; // Production ID
    private interstitialAdId: string = 'ca-app-pub-3940256099942544/1033173712'; // Test ID (Update to Production later)
    private isInitialized: boolean = false;
    private listenersInitialized: boolean = false; // Singleton listener guard
    private timeoutId: any = null;
    private TIMEOUT_DURATION = 60000; // 60 seconds (video ads can be long)
    private PRELOAD_TIMEOUT = 10000; // 10 seconds safety timeout

    // Diagnostic State
    private adError: { type: string; details: any; timestamp: string } | null = null;
    private adErrorListeners: ((error: any) => void)[] = [];

    // Banner & Concurrency State
    private isBannerShowing: boolean = false;
    private isBannerLoading: boolean = false;
    private hasInitializedBanner: boolean = false;
    private isAppReady: boolean = false;
    private bannerPromise: Promise<void> = Promise.resolve();

    // Callbacks
    private onReadyCallbacks: AdEventHandler[] = [];
    private onRewardedCallbacks: AdEventHandler[] = [];
    private onDismissedCallbacks: AdEventHandler[] = [];
    private onErrorCallbacks: AdErrorHandler[] = [];
    private bannerListeners: ((showing: boolean) => void)[] = [];

    private constructor() {
        if (Capacitor.isNativePlatform()) {
            this.setupListeners();
            // Guard de App Pronto (1 segundo após o construtor)
            setTimeout(() => {
                this.isAppReady = true;
                console.log('[AdMob] App Ready Guard ativado');
            }, 1000);
        }
    }

    public static getInstance(): AdManager {
        if (!AdManager.instance) {
            AdManager.instance = new AdManager();
        }
        return AdManager.instance;
    }

    private lastRewardTime: number = 0;
    private lastDismissedTime: number = 0;
    private lastShowTime: number = 0;

    private setupListeners() {
        if (this.listenersInitialized) return;

        console.log('[AdMob-v8] Registering core listeners...');

        const handleReward = async (reward: any) => {
            const now = Date.now();
            if (now - this.lastRewardTime < 3000) return;
            this.lastRewardTime = now;

            console.log('[AD FLOW] Reward received:', reward);
            this.clearTimeout();

            // EXECUÇÃO IMEDIATA DA RECOMPENSA (REQUISITO 1)
            console.log('[AD FLOW] Executing reward callbacks immediately');
            await Promise.all(this.onRewardedCallbacks.map(async (cb, idx) => {
                try {
                    await cb();
                    console.log(`[AD FLOW] Callback ${idx} sync successful`);
                } catch (e) {
                    console.error(`[AD FLOW] Callback ${idx} sync failed:`, e);
                }
            }));
        };

        const handleDismiss = async () => {
            const now = Date.now();
            if (now - this.lastDismissedTime < 2000) return;
            this.lastDismissedTime = now;

            console.log('[AD FLOW] Ad dismissed');
            this.state = AdState.IDLE;
            this.clearTimeout();

            // APENAS NOTIFICA DISMISS (REQUISITO 1 & 2)
            this.onDismissedCallbacks.forEach(cb => {
                try { cb(); } catch (e) { console.error('[AdMob-v8] Dismiss callback fail:', e); }
            });

            // PREPARA PRÓXIMO ANÚNCIO SEM DISPARAR (REQUISITO 1)
            console.log('[AdMob-v8] Preloading next ad for future use...');
            this.preload();
        };


        AdMob.addListener(RewardAdPluginEvents.Loaded, (info: any) => {
            console.log('[AdMob] EVENT: Loaded', info);
            
            // CRITICAL: If we are already showing, do NOT touch the state
            if (this.state === AdState.SHOWING) {
                console.log('[AdMob] Load event ignored while SHOWING');
                return;
            }

            this.state = AdState.READY;
            this.clearTimeout(); // Clear preload timeout
            this.onReadyCallbacks.forEach(cb => cb());
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
            console.log('[AdMob] EVENT: FailedToLoad', error);
            this.state = AdState.ERROR;
            this.clearTimeout();
            this.handleAdError('FAILED_TO_LOAD', error);
            this.onErrorCallbacks.forEach(cb => cb(error.message));
        });

        AdMob.addListener(RewardAdPluginEvents.Showed, () => {
            console.log('[AdMob] EVENT: Showed');
            this.state = AdState.SHOWING;
            this.startShowTimeout();
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
            console.log('[AdMob] EVENT: FailedToShow', error);
            this.state = AdState.ERROR;
            this.clearTimeout();
            this.handleAdError('FAILED_TO_SHOW', error);
            this.onErrorCallbacks.forEach(cb => cb(error.message));
        });

        AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
            console.log('[AdMob] EVENT: Rewarded', reward);
            handleReward(reward);
        });

        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            console.log('[AdMob] EVENT: Dismissed');
            handleDismiss();
        });

        this.listenersInitialized = true;
    }

    private handleAdError(type: string, details: any) {
        const error = {
            type,
            details,
            timestamp: new Date().toISOString()
        };
        console.error('[AdMob ERROR]:', type, details);
        this.adError = error;
        this.adErrorListeners.forEach(cb => cb(error));
    }

    public getAdError() {
        return this.adError;
    }

    public onAdError(cb: (error: any) => void) {
        this.adErrorListeners.push(cb);
    }

    public async initialize(customAdId?: string) {
        if (customAdId) this.rewardAdId = customAdId;

        try {
            if (Capacitor.isNativePlatform()) {
                console.log('[AdMob] Native setup...');
                if (!this.isInitialized) {
                    await AdMob.initialize();
                    this.isInitialized = true;
                    console.log('[AdMob] ✅ Native SDK Initialized');
                }
                this.setupListeners();
                await this.preload();
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
        
        console.log('[AdMob] Calling preload()...');
        this.state = AdState.LOADING;
        this.adError = null; // Reset error on new preload attempt
        
        try {
            const options: RewardAdOptions = {
                adId: this.rewardAdId,
                isTesting: false
            };
            
            this.startPreloadTimeout();
            await AdMob.prepareRewardVideoAd(options);
            console.log('[AdMob] AdMob.prepareRewardVideoAd() promise resolved');
        } catch (error: any) {
            console.error('[AdMob] Preload error:', error);
            this.handleAdError('FAILED_TO_LOAD', error?.message || error);
            this.state = AdState.ERROR;
            this.clearTimeout();
        }
    }

    public async show(): Promise<boolean> {
        // TRAVA (REQUISITO 3)
        if (this.state === AdState.SHOWING) {
            console.warn('[AdMob] Ad is already playing. Blocking simultaneous call.');
            return false;
        }

        if (!Capacitor.isNativePlatform()) {
            console.log('[AdMob] Showing Mock Web Ad');
            setTimeout(() => {
                console.log('[AdMob] Mock Rewarded');
                this.onRewardedCallbacks.forEach(cb => cb());
                console.log('[AdMob] Mock Dismissed');
                this.onDismissedCallbacks.forEach(cb => cb());
            }, 1000);
            return true;
        }

        if (this.state !== AdState.READY) {
            console.warn('[AdMob] Ad not ready. Current state:', this.state);
            this.handleAdError('AD_NOT_READY', { currentState: this.state });
            await this.preload();
            return false;
        }

        await this.executeShowDirectly();
        return true;
    }

    private async executeShowDirectly() {
        try {
            console.log('[AdMob] Calling AdMob.showRewardVideoAd()...');
            await AdMob.showRewardVideoAd();
        } catch (error: any) {
            console.error('[AdMob] executeShowDirectly error:', error);
            this.handleAdError('FAILED_TO_SHOW', error?.message || error);
            this.state = AdState.ERROR;
        }
    }

    private startPreloadTimeout() {
        this.clearTimeout();
        this.timeoutId = setTimeout(() => {
            if (this.state === AdState.LOADING) {
                console.warn('[AdMob] Preload Timeout reached (10s).');
                this.state = AdState.ERROR;
                this.handleAdError('TIMEOUT_NO_EVENT', 'No Loaded or FailedToLoad event received within 10s');
                this.onErrorCallbacks.forEach(cb => cb("Timeout ao carregar anúncio"));
            }
        }, this.PRELOAD_TIMEOUT);
    }

    private startShowTimeout() {
        this.clearTimeout();
        this.timeoutId = setTimeout(() => {
            if (this.state === AdState.SHOWING) {
                console.warn('[AdMob] Show Timeout reached (60s). Forcing dismissal to unfreeze UI.');
                this.state = AdState.IDLE;
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

    public getState(): AdState {
        return this.state;
    }

    public isAdReady(): boolean {
        return this.state === AdState.READY;
    }

    // Listener Subscription
    public onReady(cb: AdEventHandler) { this.onReadyCallbacks.push(cb); }
    public onRewarded(cb: AdEventHandler) { this.onRewardedCallbacks.push(cb); }
    public onDismissed(cb: AdEventHandler) { this.onDismissedCallbacks.push(cb); }
    public onError(cb: AdErrorHandler) { this.onErrorCallbacks.push(cb); }
    public onBannerStateChange(cb: (showing: boolean) => void) { 
        this.bannerListeners.push(cb);
        // Notifica o estado atual imediatamente para o novo listener
        cb(this.isBannerShowing);
    }

    private notifyBannerListeners() {
        this.bannerListeners.forEach(cb => cb(this.isBannerShowing));
    }

    public isBannerActive(): boolean {
        return this.isBannerShowing;
    }

    public removeAllListeners() {
        this.onReadyCallbacks = [];
        this.onRewardedCallbacks = [];
        this.onDismissedCallbacks = [];
        this.onErrorCallbacks = [];
    }

    // --- BANNER METHODS ---

    // --- BANNER METHODS (GLOBAL & SECURE) ---

    public async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER) {
        if (!Capacitor.isNativePlatform()) return;

        this.bannerPromise = this.bannerPromise.then(async () => {
            console.log('[AdMob] Solicitando banner global...');

            // 1. Guard de Inicialização Única
            if (this.hasInitializedBanner) {
                console.warn('[AdMob] Banner já foi inicializado anteriormente');
                return;
            }

            // 2. Guard de App Pronto
            if (!this.isAppReady) {
                console.warn('[AdMob] ⏳ App não está pronto ainda (Guard de 1s)');
                return;
            }

            // 3. Guard de Visibilidade (Visibility API)
            if (document.visibilityState !== 'visible') {
                console.warn('[AdMob] App não está visível');
                return;
            }

            // 4. Guard de Duplicação Simples
            if (this.isBannerShowing || this.isBannerLoading) {
                console.warn('[AdMob] 🔁 Banner já está ativo ou em carregamento');
                return;
            }

            this.isBannerLoading = true;
            console.log('[AdMob] 🏁 Iniciando AdMob.showBanner nativo...');

            try {
                const options: BannerAdOptions = {
                    adId: this.bannerAdId,
                    adSize: BannerAdSize.ADAPTIVE_BANNER,
                    position: position,
                    margin: 0,
                    isTesting: false // Produção ativada
                };

                console.log('[AdMob] Executando AdMob.showBanner global...');
                await Promise.race([
                    AdMob.showBanner(options),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
                ]);

                this.isBannerShowing = true;
                this.notifyBannerListeners();
                this.hasInitializedBanner = true; // Marca como inicializado globalmente
                console.log('[AdMob] ✨ Banner Global exibido com sucesso');
            } catch (error) {
                console.error('[AdMob] Erro ao exibir banner global:', error);
            } finally {
                this.isBannerLoading = false;
            }
        });

        return this.bannerPromise;
    }

    public async removeBanner() {
        if (!Capacitor.isNativePlatform()) return;

        this.bannerPromise = this.bannerPromise.then(async () => {
            console.log('[AdMob] Removendo banner manual/reset...');
            try {
                await AdMob.removeBanner();
                this.isBannerShowing = false;
                this.notifyBannerListeners();
                this.hasInitializedBanner = false; // Permite reinicializar se necessário (ex: logout)
            } catch (error) {
                console.warn('[AdMob] removeBanner falhou:', error);
            }
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

    // --- INTERSTITIAL METHODS ---

    public async showInterstitial() {
        if (!Capacitor.isNativePlatform()) return;
        
        try {
            await AdMob.prepareInterstitial({ 
                adId: this.interstitialAdId,
                isTesting: false 
            });
            await AdMob.showInterstitial();
        } catch (error) {
            console.error('[AdMob] Interstitial failed:', error);
        }
    }
}

export default AdManager.getInstance();
