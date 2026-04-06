export const getSiteUrl = (): string => {
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
    // Safe default for unexpected contexts (Production URL)
    return 'https://feiraodaorca.com';
};
