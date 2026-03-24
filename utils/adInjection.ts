
import { AdItem } from '../types';

/**
 * Injects Native Ad placeholders into the feed logic.
 * Follows Rule #3 and #8: Max 3 ads, injected every 10 items.
 */
export const injectAdsIntoFeed = (items: AdItem[]): (AdItem | { isAd: true; adId: string })[] => {
  if (!items || items.length === 0) return [];

  const result: (AdItem | { isAd: true; adId: string })[] = [];
  let adsInjected = 0;
  const MAX_ADS = 3;
  const INJECTION_INTERVAL = 10;

  items.forEach((item, index) => {
    result.push(item);
    
    // Inject ad after every 10 items, up to MAX_ADS
    if ((index + 1) % INJECTION_INTERVAL === 0 && adsInjected < MAX_ADS) {
      result.push({ isAd: true, adId: `native-ad-${adsInjected}` });
      adsInjected++;
    }
  });

  return result;
};
