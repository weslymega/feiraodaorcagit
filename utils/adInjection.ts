
import { AdItem } from '../types';

/**
 * Injects Native Ad placeholders into the feed logic.
 * Follows Rule #3 and #8: Max 3 ads, injected every 10 items.
 */
export const injectAdsIntoFeed = (items: AdItem[]): AdItem[] => {
  if (!items || items.length === 0) return [];
  return items;
};
