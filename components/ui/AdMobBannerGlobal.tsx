
import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import AdManager from '../../services/AdManager';

const adManager = AdManager.getInstance();

/**
 * Componente de Banner Global
 * Renderizado no AppRouter para garantir que o banner exista apenas UMA vez
 * e persista durante toda a vida do aplicativo.
 */
export const AdMobBannerGlobal: React.FC = () => {
    const hasRun = useRef(false);

    useEffect(() => {
        // Apenas em plataformas nativas (Android/iOS)
        if (!Capacitor.isNativePlatform()) return;

        // Proteção contra React StrictMode (Garante execução única)
        if (hasRun.current) return;
        hasRun.current = true;

        console.log('[AdMob] Iniciando agendamento do banner global...');

        // Delay de segurança de 1.2s para garantir que a Activity e o Layout estão prontos
        const timer = setTimeout(() => {
            console.log('[AdMob] Disparando showBanner global após delay...');
            adManager.showBanner();
        }, 1200);

        return () => {
            // NOTA: Não removemos o banner aqui para que ele persista na navegação.
            // O removeBanner só deve ser chamado em casos de reset/logout.
            clearTimeout(timer);
        };
    }, []);

    // Este componente não renderiza nada no DOM Web, 
    // pois o AdMob renderiza uma View nativa sobre o WebView.
    return null;
};
