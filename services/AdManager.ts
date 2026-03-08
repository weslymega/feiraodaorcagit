import {
    AdMob,
    RewardAdPluginEvents,
    AdOptions
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
    private adId: string = 'ca-app-pub-3940256099942544/5224354917'; // Default Test ID
    private isInitialized: boolean = false;
    private listenersInitialized: boolean = false; // Singleton listener guard
    private timeoutId: any = null;
    private TIMEOUT_DURATION = 15000; // 15 seconds

    // Queue State
    private requiredAds: number = 0;
    private watchedAds: number = 0;
    private isProcessingReward: boolean = false; // Guard for sync
    private queueActive: boolean = false;

    // Callbacks
    private onReadyCallbacks: AdEventHandler[] = [];
    private onRewardedCallbacks: AdEventHandler[] = [];
    private onDismissedCallbacks: AdEventHandler[] = [];
    private onCompletedCallbacks: AdEventHandler[] = []; // New
    private onErrorCallbacks: AdErrorHandler[] = [];

    private constructor() {
        if (Capacitor.isNativePlatform()) {
            this.setupListeners();
        }
    }

    public static getInstance(): AdManager {
        if (!AdManager.instance) {
            AdManager.instance = new AdManager();
        }
        return AdManager.instance;
    }

    private setupListeners() {
        if (this.listenersInitialized) return;

        console.log('[AdMob-v8] Registering listeners once...');

        // Rewarded Event
        AdMob.addListener(RewardAdPluginEvents.Rewarded, async (reward: any) => {
            console.log('[AdMob-v8] Event: onRewardedAdRewarded', reward);
            this.clearTimeout();
            this.watchedAds++;

            this.isProcessingReward = true;
            try {
                // Await all reward handlers (server sync)
                await Promise.all(this.onRewardedCallbacks.map(cb => cb()));
            } catch (err) {
                console.error('[AdMob-v8] Error processing reward callbacks:', err);
            } finally {
                this.isProcessingReward = false;
            }
        });

        // Dismissed Event
        AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
            console.log('[AdMob-v8] Event: onRewardedAdDismissed');
            this.state = AdState.IDLE;
            this.clearTimeout();

            // Notificamos a tela imediatamente (onDismissed costuma ser síncrono para UI)
            this.onDismissedCallbacks.forEach(cb => cb());

            // Lógica de Fila: Aguardamos o processamento da recompensa E o delay de estabilidade
            if (this.queueActive) {
                console.log('[AdMob-v8] Ad Queue active. Waiting for sync and stability...');

                // Esperamos até 2 segundos se o processamento ainda estiver ocorrendo
                let waitCheck = 0;
                while (this.isProcessingReward && waitCheck < 20) {
                    await new Promise(r => setTimeout(r, 100));
                    waitCheck++;
                }

                setTimeout(() => {
                    this.showNextAd();
                }, 700);
            } else {
                this.preload(); // Preload regular se não estiver em fila
            }
        });

        // Failed To Show Event
        AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
            console.error('[AdMob-v8] Event: onRewardedAdFailedToShow', error);
            this.state = AdState.ERROR;
            this.clearTimeout();
            this.onErrorCallbacks.forEach(cb => cb(error.message));

            if (this.queueActive) {
                console.log('[AdMob-v8] Failed to show in queue. Retrying next ad in 1s...');
                setTimeout(() => this.showNextAd(), 1000);
            } else {
                setTimeout(() => this.preload(), 1000);
            }
        });

        // Loaded Event
        AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
            console.log('[AdMob-v8] Event: onRewardedAdLoaded (READY)');
            this.state = AdState.READY;
            this.onReadyCallbacks.forEach(cb => cb());

            // Se estivermos em fila, mostramos imediatamente após o carregamento
            if (this.queueActive) {
                console.log('[AdMob-v8] Queue Active: Auto-showing loaded ad');
                this.executeShowDirectly();
            }
        });

        // Failed To Load Event
        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
            console.error('[AdMob-v8] Event: onRewardedAdFailedToLoad', error);
            this.state = AdState.ERROR;
            this.onErrorCallbacks.forEach(cb => cb(error.message));

            if (this.queueActive) {
                console.log('[AdMob-v8] Failed to load in queue. Retrying in 3s...');
                setTimeout(() => this.showNextAd(), 3000);
            } else {
                setTimeout(() => this.preload(), 5000);
            }
        });

        this.listenersInitialized = true;
    }

    public async initialize(customAdId?: string) {
        if (this.isInitialized) return;
        if (customAdId) this.adId = customAdId;

        try {
            if (Capacitor.isNativePlatform()) {
                console.log('[AdMob-v8] Initializing AdMob Native...');
                await AdMob.initialize();
                this.isInitialized = true;
                await this.preload();
            } else {
                console.log('[AdMob-v8] Initializing AdMob Web Mock...');
                this.isInitialized = true;
                this.state = AdState.READY;
            }
        } catch (error) {
            console.error('[AdMob-v8] Initialization failed:', error);
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
                adId: this.adId,
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
}

export default AdManager.getInstance();
