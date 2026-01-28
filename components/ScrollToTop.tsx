import { useEffect } from 'react';
import { Screen } from '../types';

interface ScrollToTopProps {
    currentScreen: Screen;
}

export default function ScrollToTop({ currentScreen }: ScrollToTopProps) {
    useEffect(() => {
        const container = document.getElementById('app-main-container');
        if (container) {
            container.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [currentScreen]);

    return null;
}
