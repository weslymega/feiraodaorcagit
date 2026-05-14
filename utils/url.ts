export const getSiteUrl = () => {
    // No APK ou em produção, usamos sempre a URL oficial definida no .env
    const envUrl = import.meta.env.VITE_APP_URL;
    
    if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Se estivermos no browser em localhost, usamos o origin local para o redirect.
        // No APK (Capacitor), mesmo sendo localhost internamente, usamos a URL de produção para Deep Links.
        const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || window.location.origin.includes('capacitor://');

        if (isLocalhost && !isCapacitor) {
            return window.location.origin;
        }

        return envUrl || 'https://feiraodaorca.com';
    }
    
    return envUrl || 'https://feiraodaorca.com';
};
