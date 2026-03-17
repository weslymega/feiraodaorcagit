import { useEffect, useLayoutEffect } from 'react';
import { Screen } from '../types';

interface ScrollToTopProps {
    currentScreen: Screen;
}

export default function ScrollToTop({ currentScreen }: ScrollToTopProps) {
    // useLayoutEffect tenta o reset ANTES da pintura da tela (mais rápido que useEffect)
    useLayoutEffect(() => {
        const resetScroll = (behavior: ScrollBehavior = 'auto') => {
            const container = document.getElementById('app-main-container');
            if (container) {
                // Força o jump imediato via scrollTop e scrollTo
                container.scrollTop = 0;
                container.scrollTo({ top: 0, behavior });
            }
            
            // Backup agressivo na window e documentElement
            window.scrollTo({ top: 0, behavior });
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
        };

        // 1. Reset Imediato
        resetScroll('auto');

        // 2. Reset no próximo frame (após commit do DOM)
        const rafId = requestAnimationFrame(() => resetScroll('auto'));

        // 3. Sequência de fallbacks para combater carregamentos assíncronos e animações
        const t1 = setTimeout(() => resetScroll('auto'), 50);
        const t2 = setTimeout(() => resetScroll('auto'), 150);
        const t3 = setTimeout(() => resetScroll('auto'), 400); // Delay maior para garantir

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [currentScreen]);

    return null;
}
