/**
 * Utility function to resolve the site URL consistent across environments.
 * Priorities:
 * 1. Localhost Safety Check (Prevents redirects to Prod when running locally)
 * 2. Environment Variable (VITE_SITE_URL or NEXT_PUBLIC_SITE_URL) - Production/Preview overrides
 * 3. Window Location Origin - Automatic (Browser)
 * 4. Default Fallback - Localhost
 */
export const getSiteUrl = (): string => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // 0. Safety Check: If we are on ANY local environment (localhost, 127.0.0.1, 0.0.0.0, or local IP 192.168.x.x)
        // ALWAYS use window.location.origin.
        // This overrides any stray env vars that might point to a dead Vercel deployment.
        const isLocal =
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.endsWith('.local');

        if (isLocal) {
            console.log('🔒 [getSiteUrl] Detected Local Environment:', window.location.origin);
            return window.location.origin;
        }
    }

    // 1. Try Environment Variables first (useful for Vercel/Production overrides)
    // Note: logic handles cases where variables might be set without protocol
    const envUrl = import.meta.env.VITE_SITE_URL || import.meta.env.NEXT_PUBLIC_SITE_URL;

    if (envUrl) {
        // Ensure protocol is present
        return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
    }

    // 2. Try Browser Window (Most reliable for Client-Side SPAs)
    // This handles dynamic domains, localhost ports, and preview URLs automatically
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    // 3. Final Fallback (Should rarely be reached in browser)
    // Safe default for unexpected contexts
    return 'http://localhost:3000';
};
