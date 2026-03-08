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

type AdEventHandler = () => void;
type AdErrorHandler = (error: string) => void;

class AdManager {
    private static instance: AdManager;
    private state: AdState = AdState.IDLE;
    private adId: string = 'ca-app-pub-3940256099942544/5224354917'; // Default Test ID
    private isInitialized: boolean = false;
    private timeoutId: any = null;
    private TIMEOUT_DURATION = 15000; // 15 seconds

    // Callbacks
    private onReadyCallbacks: AdEventHandler[] = [];
    private onRewardedCallbacks: AdEventHandler[] = [];
    private onDismissedCallbacks: AdEventHandler[] = [];
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
        // Rewarded Event
        AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: any) => {
            console.log('[AdMob-v8] Event: onRewardedAdRewarded', reward);
            this.clearTimeout();
            this.onRewardedCallbacks.forEach(cb => cb());
        });

        // Dismissed Event
        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            console.log('[AdMob-v8] Event: onRewardedAdDismissed');
            this.state = AdState.IDLE;
            this.clearTimeout();
            this.onDismissedCallbacks.forEach(cb => cb());
            this.preload(); // Preload next one
        });

        // Failed To Show Event
        AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
            console.error('[AdMob-v8] Event: onRewardedAdFailedToShow', error);
            this.state = AdState.ERROR;
            this.clearTimeout();
            this.onErrorCallbacks.forEach(cb => cb(error.message));
            this.preload(); // Retry preloading
        });

        // Loaded Event
        AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
            console.log('[AdMob-v8] Event: onRewardedAdLoaded');
            this.state = AdState.READY;
            this.onReadyCallbacks.forEach(cb => cb());
        });

        // Failed To Load Event
        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
            console.error('[AdMob-v8] Event: onRewardedAdFailedToLoad', error);
            this.state = AdState.ERROR;
            this.onErrorCallbacks.forEach(cb => cb(error.message));
            // Auto-retry load after 5 seconds
            setTimeout(() => this.preload(), 5000);
        });
    }

    public async initialize(customAdId?: string) {
        if (this.isInitialized) return;
        if (customAdId) this.adId = customAdId;

        try {
            if (Capacitor.isNativePlatform()) {
                await AdMob.initialize();
                this.isInitialized = true;
                await this.preload();
            } else {
                this.isInitialized = true;
                this.state = AdState.READY; // Always ready for mock
            }
        } catch (error) {
            console.error('[AdManager] Initialization failed:', error);
        }
    }

    public async preload() {
        if (!this.isInitialized) return;
        if (this.state === AdState.LOADING || this.state === AdState.SHOWING) return;

        if (Capacitor.isNativePlatform()) {
            this.state = AdState.LOADING;
            const options: AdOptions = {
                adId: this.adId,
            };
            try {
                await AdMob.prepareRewardVideoAd(options);
            } catch (error) {
                console.error('[AdManager] Preload Error:', error);
                this.state = AdState.ERROR;
            }
        } else {
            this.state = AdState.READY;
        }
    }

    public async show(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            // Web Mock
            console.log('[AdManager] Showing Mock Web Ad');
            // Simulate async behavior
            setTimeout(() => {
                this.onRewardedCallbacks.forEach(cb => cb());
                this.onDismissedCallbacks.forEach(cb => cb());
            }, 1000);
            return true;
        }

        if (this.state !== AdState.READY) {
            console.warn('[AdManager] Ad not ready to show. Current state:', this.state);
            await this.preload();
            return false;
        }

        try {
            this.state = AdState.SHOWING;
            this.startTimeout();
            await AdMob.showRewardVideoAd();
            return true;
        } catch (error) {
            console.error('[AdManager] Show Error:', error);
            this.clearTimeout();
            this.state = AdState.ERROR;
            this.preload();
            return false;
        }
    }

    private startTimeout() {
        this.clearTimeout();
        this.timeoutId = setTimeout(() => {
            console.warn('[AdManager] Ad Timeout reached (15s). Forcing dismissal.');
            this.state = AdState.IDLE;
            this.onDismissedCallbacks.forEach(cb => cb());
            this.preload();
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

    public removeAllListeners() {
        this.onReadyCallbacks = [];
        this.onRewardedCallbacks = [];
        this.onDismissedCallbacks = [];
        this.onErrorCallbacks = [];
    }
}

export default AdManager.getInstance();
