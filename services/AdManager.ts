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

    private lastRewardTime: number = 0;
    private lastDismissedTime: number = 0;

    private setupListeners() {
        if (this.listenersInitialized) return;

        console.log('[AdMob-v8] Registering robust listeners for all Reward variations...');

        const handleReward = async (reward: any) => {
            const now = Date.now();
            if (now - this.lastRewardTime < 2000) {
                console.log('[AdMob-v8] DUPLICATE REWARD IGNORED');
                return;
            }
            this.lastRewardTime = now;

            console.log('[AdMob-v8] REWARD RECEIVED:', reward);
            this.clearTimeout();
            this.watchedAds++;

            // We do NOT await here to let the Native SDK show the Close button immediately.
            // But we set the flag so handleDismiss knows we are still busy.
            this.isProcessingReward = true;

            // Execute sync tasks in the background
            (async () => {
                try {
                    await Promise.all(this.onRewardedCallbacks.map(cb => {
                        try { return cb(); } catch (e) { console.error('[AdMob-v8] Callback error:', e); }
                    }));
                } catch (err) {
                    console.error('[AdMob-v8] Error processing reward callbacks:', err);
                } finally {
                    this.isProcessingReward = false;
                    console.log('[AdMob-v8] Reward processing (sync) finished.');
                }
            })();
        };

        const handleDismiss = async () => {
            const now = Date.now();
            if (now - this.lastDismissedTime < 2000) {
                console.log('[AdMob-v8] DUPLICATE DISMISS IGNORED');
                return;
            }
            this.lastDismissedTime = now;

            console.log('[AdMob-v8] DISMISSED RECEIVED');
            this.state = AdState.IDLE;
            this.clearTimeout();

            this.onDismissedCallbacks.forEach(cb => {
                try { cb(); } catch (e) { console.error('[AdMob-v8] Callback error (Dismiss):', e); }
            });

            if (this.queueActive) {
                console.log('[AdMob-v8] Queue active. Waiting for reward sync and stable delay...');

                // Wait for sync to complete (max 3s)
                let waitCheck = 0;
                while (this.isProcessingReward && waitCheck < 30) {
                    await new Promise(r => setTimeout(r, 100));
                    waitCheck++;
                }

                setTimeout(() => {
                    if (this.queueActive) {
                        this.showNextAd();
                    }
                }, 700);
            } else {
                this.preload();
            }
        };

        // Variation 1: Plugin Constants
        AdMob.addListener(RewardAdPluginEvents.Rewarded, (r) => handleReward(r));
        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => handleDismiss());

        // Variation 2: Absolute Strings (v8 Common names)
        // Many v8 builds use these specific strings or 'onRewarded'
        AdMob.addListener('onRewardedVideoAdReward' as any, (r) => handleReward(r));
        AdMob.addListener('onRewardedVideoAdDismissed' as any, () => handleDismiss());
        AdMob.addListener('rewardAdRewarded' as any, (r) => handleReward(r));
        AdMob.addListener('rewardAdDismissed' as any, () => handleDismiss());

        // Variation 3: Loaded and Failed
        AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
            console.log('[AdMob-v8] Event: Loaded (READY)');
            this.state = AdState.READY;
            this.onReadyCallbacks.forEach(cb => cb());
            if (this.queueActive) this.executeShowDirectly();
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
            console.error('[AdMob-v8] Event: FailedToShow', error);
            this.state = AdState.ERROR;
            this.clearTimeout();
            this.onErrorCallbacks.forEach(cb => cb(error.message));
            if (this.queueActive) setTimeout(() => this.showNextAd(), 1000);
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
            console.error('[AdMob-v8] Event: FailedToLoad', error);
            this.state = AdState.ERROR;
            this.onErrorCallbacks.forEach(cb => cb(error.message));
            if (this.queueActive) setTimeout(() => this.showNextAd(), 3000);
        });

        this.listenersInitialized = true;
    }

    public async initialize(customAdId?: string) {
        if (customAdId) this.adId = customAdId;

        try {
            if (Capacitor.isNativePlatform()) {
                console.log('[AdMob-v8] Initializing AdMob Native Step...');
                if (!this.isInitialized) {
                    await AdMob.initialize();
                    this.isInitialized = true;
                }
                // Call setup listeners in initialize to ensure it runs when ready
                this.setupListeners();
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
