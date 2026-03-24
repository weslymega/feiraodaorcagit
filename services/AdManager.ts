import {
    AdMob,
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
    private rewardAdId: string = 'ca-app-pub-3940256099942544/5224354917'; // Test ID
    private bannerAdId: string = 'ca-app-pub-3940256099942544/6300978111'; // Test ID
    private interstitialAdId: string = 'ca-app-pub-3940256099942544/1033173712'; // Test ID
    private isInitialized: boolean = false;
    private listenersInitialized: boolean = false; // Singleton listener guard
    private timeoutId: any = null;
    private TIMEOUT_DURATION = 60000; // 60 seconds (video ads can be long)
    private STABILIZATION_DELAY = 500; // Delay before heavy JS work

    // Queue State
    private requiredAds: number = 0;
    private watchedAds: number = 0;
    private isProcessingReward: boolean = false;
    private queueActive: boolean = false;

    // Banner & Concurrency State
    private isTransitioning: boolean = false;
    private isBannerShowing: boolean = false;
    private isBannerLoading: boolean = false;
    private hasInitializedBanner: boolean = false;
    private isAppReady: boolean = false;
    private bannerPromise: Promise<void> = Promise.resolve();

    // Callbacks
    private onReadyCallbacks: AdEventHandler[] = [];
    private onRewardedCallbacks: AdEventHandler[] = [];
    private onDismissedCallbacks: AdEventHandler[] = [];
    private onCompletedCallbacks: AdEventHandler[] = []; // New
    private onErrorCallbacks: AdErrorHandler[] = [];

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

        const handleReward = (reward: any) => {
            const now = Date.now();
            if (now - this.lastRewardTime < 3000) return;
            this.lastRewardTime = now;

            console.log('[AD FLOW] Reward received:', reward);
            this.clearTimeout();
            this.watchedAds++;
            console.log(`[AD FLOW] Local progress updated: ${this.watchedAds}/${this.requiredAds}`);

            this.isProcessingReward = true;
            // No longer triggering callbacks here to keep bridge clear for native UI
        };

        const handleDismiss = async () => {
            const now = Date.now();
            if (now - this.lastDismissedTime < 2000) return;
            this.lastDismissedTime = now;

            console.log('[AD FLOW] Ad dismissed');
            this.state = AdState.IDLE;
            this.clearTimeout();

            // Execute synchronization ONLY after dismissal
            if (this.isProcessingReward) {
                console.log('[AD FLOW] Starting Supabase sync (Deferred from reward)');
                await Promise.all(this.onRewardedCallbacks.map(async (cb, idx) => {
                    try {
                        await cb();
                        console.log(`[AD FLOW] Callback ${idx} sync successful`);
                    } catch (e) {
                        console.error(`[AD FLOW] Callback ${idx} sync failed:`, e);
                    }
                }));
                this.isProcessingReward = false;
                console.log('[AD FLOW] Supabase sync completed');
            }

            this.onDismissedCallbacks.forEach(cb => {
                try { cb(); } catch (e) { console.error('[AdMob-v8] Dismiss callback fail:', e); }
            });

            if (this.queueActive) {
                console.log('[AdMob-v8] Proceeding with ad queue...');
                setTimeout(() => {
                    if (this.queueActive && this.state !== AdState.SHOWING) {
                        this.showNextAd();
                    }
                }, 800);
            }
        };

        // CORE LISTENERS ONLY - No duplicates
        AdMob.addListener(RewardAdPluginEvents.Rewarded, (r) => handleReward(r));
        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => handleDismiss());

        AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
            console.log('[AdMob-v8] Loaded event. Current state:', this.state);

            // CRITICAL: If we are already showing, do NOT touch the state
            if (this.state === AdState.SHOWING) {
                console.log('[AdMob-v8] Load event ignored while SHOWING');
                return;
            }

            this.state = AdState.READY;
            this.onReadyCallbacks.forEach(cb => cb());

            // Solo auto-show si estamos en cola y NADA se está mostrando
            if (this.queueActive && this.state === AdState.READY) {
                this.executeShowDirectly();
            }
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
            console.error('[AdMob-v8] FailedToShow:', error);
            this.state = AdState.ERROR;
            this.clearTimeout();
            this.onErrorCallbacks.forEach(cb => cb(error.message));
            if (this.queueActive) setTimeout(() => this.showNextAd(), 1500);
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
            console.error('[AdMob-v8] FailedToLoad:', error);
            this.state = AdState.ERROR;
            this.onErrorCallbacks.forEach(cb => cb(error.message));
            if (this.queueActive) setTimeout(() => this.showNextAd(), 3000);
        });

        this.listenersInitialized = true;
    }

    public async initialize(customAdId?: string) {
        if (customAdId) this.rewardAdId = customAdId;

        try {
            if (Capacitor.isNativePlatform()) {
                console.log('[AdMob-v8] Native setup...');
                if (!this.isInitialized) {
                    await AdMob.initialize();
                    this.isInitialized = true;
                }
                this.setupListeners();
                await this.preload();
            } else {
                this.isInitialized = true;
                this.state = AdState.READY;
            }
        } catch (error) {
            console.error('[AdMob-v8] Init error:', error);
        }
    }

    // --- LÓGICA DE FILA (AD QUEUE) ---

    public startAdQueue(totalAds: number, initialWatched: number = 0) {
        console.log(`[AdMob-v8] Starting Ad Queue: ${totalAds} ads required. Current: ${initialWatched}`);
        this.requiredAds = totalAds;
        this.watchedAds = initialWatched;
        this.queueActive = true;
        this.showNextAd();
    }

    public async showNextAd() {
        if (!this.queueActive) return;

        console.log(`[AdMob-v8] Queue Progress: ${this.watchedAds}/${this.requiredAds}`);

        if (this.watchedAds >= this.requiredAds) {
            console.log('[AdMob-v8] Ad Queue completed successfully!');
            this.queueActive = false;
            this.onCompletedCallbacks.forEach(cb => cb()); // Trigger completion
            return;
        }

        // Se não estiver pronto, preparamos (o listener Loaded cuidará do Show)
        if (this.state !== AdState.READY) {
            console.log('[AdMob-v8] Ad not ready for queue step. Preparing...');
            await this.preload();
        } else {
            console.log('[AdMob-v8] Ad already ready. Showing...');
            this.executeShowDirectly();
        }
    }

    private async executeShowDirectly() {
        if (this.state !== AdState.READY) return;

        const now = Date.now();
        if (now - this.lastShowTime < 3000) {
            console.warn('[AdMob-v8] show() call debounced. Too frequent.');
            return;
        }
        this.lastShowTime = now;

        try {
            console.log('[AdMob-v8] showRewardVideoAd executing...');
            this.state = AdState.SHOWING;
            this.startTimeout();
            await AdMob.showRewardVideoAd();
        } catch (error) {
            console.error('[AdMob-v8] showRewardVideoAd failed:', error);
            this.clearTimeout();
            this.state = AdState.ERROR;
            // O erro disparará FailedToShow, que por sua vez chamará showNextAd via retry
        }
    }

    // --- FIM LÓGICA DE FILA ---

    public async preload() {
        if (!this.isInitialized) return;
        if (this.state === AdState.LOADING || this.state === AdState.SHOWING) {
            console.log('[AdMob-v8] Preload skipped: state is', this.state);
            return;
        }

        if (Capacitor.isNativePlatform()) {
            console.log('[AdMob-v8] prepareRewardVideoAd executing...');
            this.state = AdState.LOADING;
            const options: AdOptions = {
                adId: this.rewardAdId,
            };
            try {
                await AdMob.prepareRewardVideoAd(options);
            } catch (error) {
                console.error('[AdMob-v8] prepareRewardVideoAd Error:', error);
                this.state = AdState.ERROR;
            }
        } else {
            this.state = AdState.READY;
        }
    }

    public async show(): Promise<boolean> {
        // Se a fila estiver ativa, o controle é interno
        if (this.queueActive) {
            console.warn('[AdMob-v8] Manually calling show while queue is active is ignored.');
            return true;
        }

        if (!Capacitor.isNativePlatform()) {
            console.log('[AdMob-v8] Showing Mock Web Ad');
            setTimeout(() => {
                console.log('[AdMob-v8] Mock Rewarded');
                this.watchedAds++;
                this.onRewardedCallbacks.forEach(cb => cb());
                console.log('[AdMob-v8] Mock Dismissed');
                this.onDismissedCallbacks.forEach(cb => cb());
            }, 1000);
            return true;
        }

        if (this.state !== AdState.READY) {
            console.warn('[AdMob-v8] Ad not ready. Current state:', this.state);
            await this.preload();
            return false;
        }

        this.executeShowDirectly();
        return true;
    }

    private startTimeout() {
        this.clearTimeout();
        this.timeoutId = setTimeout(() => {
            console.warn('[AdMob-v8] Ad Timeout reached (15s). Forcing dismissal to unfreeze UI.');
            this.state = AdState.IDLE;
            this.onDismissedCallbacks.forEach(cb => cb());
            // Se estiver em fila, o dismiss cuidará do próximo passo
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

    public getProgress(): { watched: number, required: number } {
        return { watched: this.watchedAds, required: this.requiredAds };
    }

    // Listener Subscription
    public onReady(cb: AdEventHandler) { this.onReadyCallbacks.push(cb); }
    public onRewarded(cb: AdEventHandler) { this.onRewardedCallbacks.push(cb); }
    public onDismissed(cb: AdEventHandler) { this.onDismissedCallbacks.push(cb); }
    public onCompleted(cb: AdEventHandler) { this.onCompletedCallbacks.push(cb); }
    public onError(cb: AdErrorHandler) { this.onErrorCallbacks.push(cb); }

    public removeAllListeners() {
        this.onReadyCallbacks = [];
        this.onRewardedCallbacks = [];
        this.onDismissedCallbacks = [];
        this.onCompletedCallbacks = [];
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
                console.warn('[AdMob] App não está pronto ainda');
                return;
            }

            // 3. Guard de Visibilidade (Visibility API)
            if (document.visibilityState !== 'visible') {
                console.warn('[AdMob] App não está visível');
                return;
            }

            // 4. Guard de Duplicação Simples
            if (this.isBannerShowing || this.isBannerLoading) {
                console.warn('[AdMob] Banner já está sendo exibido ou carregando');
                return;
            }

            this.isBannerLoading = true;

            try {
                const options: BannerAdOptions = {
                    adId: this.bannerAdId,
                    adSize: BannerAdSize.ADAPTIVE_BANNER,
                    position: position,
                    margin: 0,
                    isTesting: true // Ajustar para false em produção
                };

                console.log('[AdMob] Executando AdMob.showBanner global...');
                await Promise.race([
                    AdMob.showBanner(options),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
                ]);

                this.isBannerShowing = true;
                this.hasInitializedBanner = true; // Marca como inicializado globalmente
                console.log('[AdMob] Banner Global exibido com sucesso');
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
            await AdMob.prepareInterstitial({ adId: this.interstitialAdId });
            await AdMob.showInterstitial();
        } catch (error) {
            console.error('[AdMob] Interstitial failed:', error);
        }
    }
}

export default AdManager.getInstance();
