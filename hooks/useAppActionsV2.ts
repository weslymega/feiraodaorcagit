import { useState, useRef, useEffect } from 'react';
import { Screen, User, AdItem, AdStatus } from '../types';
import { AppState } from '../types/AppState';
import { api } from '../services/api'; // The new API service

export const useAppActionsV2 = (state: AppState) => {
    const {
        user, setUser,
        myAds, setMyAds,
        setCurrentScreen,
        setPreviousScreen,
        setCameFromMyAds,
        cameFromMyAds,
        adToEdit, setAdToEdit,
        setToast,
        setFairActive,
        setMaintenanceMode
    } = state;

    // --- SUPABASE INTEGRATION ---

    const handleCreateAdFinish = async (adData: Partial<AdItem>) => {
        try {
            setToast({ message: "Validando e criando anúncio...", type: 'info' });

            // 1. Call Backend to Create Ad (Backend validates 3-ad limit)
            const newAd = await api.createAd({
                ...adData,
                title: adData.title || 'Novo Anúncio',
                description: adData.description || '',
                price: adData.price || 0,
                location: user.location || 'Sem local',
                image: adData.image || '',
                category: adData.category || 'outros'
            });

            // 2. Success
            setToast({ message: "Anúncio criado com sucesso!", type: 'success' });

            // 3. Update Local State (Optimistic or Refetch)
            setMyAds(prev => [newAd, ...prev]);

            // 4. Update User Count (Optional, backend handles limit, but good for UI)
            // Ideally we refetch the profile here:
            // const updatedProfile = await api.getProfile();
            // setUser(updatedProfile);

            // 5. Navigation
            const shouldGoBackToMyAds = cameFromMyAds;
            setCameFromMyAds(false);
            setPreviousScreen(Screen.DASHBOARD);
            setCurrentScreen(Screen.MY_ADS);

        } catch (error: any) {
            console.error("Erro ao criar anúncio via Supabase:", error);

            // 6. Handle Security/Limit Errors
            if (error.message.includes('Limit Exceeded') || error.message.includes('403')) {
                alert("LIMITE ATINGIDO! \n\nVocê já usou seus 3 anúncios gratuitos deste mês.\nFaça um upgrade para continuar anunciando.");
                // Here we could redirect to a 'Subscribe' screen
                // navigateTo(Screen.PLANS);
            } else {
                setToast({ message: "Erro ao criar anúncio: " + error.message, type: 'error' });
            }
        }
    };

    const handleSubscribe = async (planId: string, price: number, title: string) => {
        try {
            setToast({ message: "Gerando link de pagamento...", type: 'info' });
            const { init_point } = await api.createPreference(planId, price, title);

            // Open Mercado Pago Checkout
            window.location.href = init_point;
        } catch (error: any) {
            setToast({ message: "Erro ao iniciar pagamento", type: 'error' });
        }
    };

    // ... (Keep other existing actions passed through or refactored similarly)
    // For brevity, I'm only showing the Critical Changes requested.

    return {
        handleCreateAdFinish,
        handleSubscribe,
        // ... include other necessary actions from original useAppActions
    };
};
