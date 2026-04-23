import { Browser } from '@capacitor/browser';

export const openExternalLink = async (url: string) => {
  try {
    await Browser.open({ url });
  } catch (error) {
    console.warn('[ExternalLink] Fallback acionado', error);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
