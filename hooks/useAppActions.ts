import { Screen, User, AdItem, AdStatus, MessageItem, ChatMessage, NotificationItem, ReportItem, DashboardPromotion, RealEstatePromotion, PartsServicesPromotion, VehiclesPromotion } from '../types';
import { CURRENT_USER, MY_ADS_DATA, FAVORITES_DATA, MOCK_NOTIFICATIONS, MOCK_REPORTS, MOCK_ADMIN_VEHICLES, MOCK_ADMIN_REAL_ESTATE, MOCK_ADMIN_PARTS_SERVICES } from '../constants';
import { MOCK_SELLER } from '../constants';
import { useRef, useEffect } from 'react';
import { AppState } from '../types/AppState';
import { api, CreateAdPayload, supabase } from '../services/api';

export const useAppActions = (state: AppState) => {
    const {
        currentScreen, setCurrentScreen,
        previousScreen, setPreviousScreen,
        user, setUser,
        myAds, setMyAds,
        favorites, setFavorites,
        setAuthLoading,

        notifications, setNotifications,
        reports, setReports,
        fairActive, setFairActive,
        maintenanceMode, setMaintenanceMode,
        adminMockAds, setAdminMockAds,
        adminAds, setAdminAds, // NEW: Full Admin List (Pending/Rejected/Active)

        selectedAd, setSelectedAd,
        adToEdit, setAdToEdit,
        cameFromMyAds, setCameFromMyAds,
        selectedChat, setSelectedChat,
        viewingProfile, setViewingProfile,
        toast, setToast,
        setFilterContext,
        dashboardPromotions, setDashboardPromotions,
        realEstatePromotions, setRealEstatePromotions,
        partsServicesPromotions, setPartsServicesPromotions,
        vehiclesPromotions, setVehiclesPromotions,
        activeRealAds, setRealAds,
        conversations, setConversations,
        chatMessages, setChatMessages,
        pendingHighlightAd, setPendingHighlightAd
    } = state;

    // Fix for Stale State in Event Handlers
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Real-time Subscription for Messages
    useEffect(() => {
        if (!user || !user.id || user.id === 'guest') return;

        console.log("📡 Subscribing to messages real-time...");
        const channel = supabase
            .channel('realtime_messages')
            .on('postgres_changes', {
                event: '*', // Listen to INSERT, UPDATE, etc.
                schema: 'public',
                table: 'messages'
            }, async (payload) => {
                const updatedMessage = payload.new as any;
                console.log("📩 Mudança em mensagens real-time:", payload.eventType, updatedMessage);

                // Sempre atualiza a lista de conversas para refletir última mensagem ou status de lido
                handleLoadConversations();

                if (payload.eventType === 'INSERT') {
                    if (selectedChat && selectedAd && updatedMessage.ad_id === selectedAd.id && user) {
                        const isRelevant = (updatedMessage.sender_id === user.id && updatedMessage.receiver_id === selectedChat.otherUserId) ||
                            (updatedMessage.sender_id === selectedChat.otherUserId && updatedMessage.receiver_id === user.id);

                        if (isRelevant) {
                            console.log("🆕 Nova mensagem recebida, recarregando...");
                            handleLoadMessages(selectedAd.id, selectedChat.otherUserId);

                            // Se eu sou o receptor, marco como lido no banco IMEDIATAMENTE pois estou com o chat aberto
                            if (user && updatedMessage.receiver_id === user.id && updatedMessage.is_read === false) {
                                await api.markMessagesAsRead(selectedAd.id, selectedChat.otherUserId);
                            }
                        }
                    }
                }

                // 2. Tratar UPDATE (Confirmação de leitura / Ticks azuis)
                if (payload.eventType === 'UPDATE') {
                    console.log("🔵 Reconciliando UPDATE de mensagem por ID...");
                    setChatMessages(prev => prev.map(msg =>
                        msg.id === updatedMessage.id
                            ? { ...msg, isRead: updatedMessage.is_read }
                            : msg
                    ));
                }
            })
            .subscribe();

        return () => {
            console.log("🔌 Unsubscribing from messages...");
            supabase.removeChannel(channel);
        };
    }, [user?.id, selectedChat?.id, selectedAd?.id]);

    // --- AUTH ACTIONS ---
    const handleAcceptTerms = async () => {
        try {
            // STEP 1: Update DB
            await api.updateTermsAcceptance();
            
            // STEP 2: Update Local State IMMEDIATELY (Loop Protection)
            setUser(prev => prev ? ({ 
                ...prev, 
                acceptedTerms: true, 
                acceptedAt: new Date().toISOString() 
            }) : null);
            
            // STEP 3: Navigate only after state is updated
            setCurrentScreen(Screen.DASHBOARD);
            setToast({ message: "Termos aceitos com sucesso! Bem-vindo.", type: 'success' });
        } catch (error) {
            console.error("❌ Erro ao aceitar termos:", error);
            // Non-blocking error: allow user to try again
            setToast({ message: "Erro ao registrar aceite. Por favor, verifique sua conexão e tente novamente.", type: 'error' });
        }
    };

    const handleForgotPassword = async (email: string) => {
        try {
            await api.sendPasswordReset(email);
            setToast({ message: "Link de recuperação enviado! Verifique seu e-mail.", type: 'success' });
        } catch (error: any) {
            console.error("❌ Erro no envio de recuperação:", error);
            // Mensagem neutra conforme requisitos
            setToast({ message: "Se o e-mail existir no sistema, você receberá um link.", type: 'success' });
        }
    };


    const handleSavePromotion = async (promoData: Partial<DashboardPromotion>) => {
        try {
            await api.savePromotion({ ...promoData, category: 'dashboard' });
            const updated = await api.getPromotions('dashboard');
            setDashboardPromotions(updated);
            setToast({ message: 'Propaganda do Dashboard salva!', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'Erro ao salvar propaganda', type: 'error' });
        }
    };

    const handleDeletePromotion = async (id: string) => {
        try {
            await api.deletePromotion(id);
            const updated = await api.getPromotions('dashboard');
            setDashboardPromotions(updated);
            setToast({ message: 'Propaganda excluída', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'Erro ao excluir propaganda', type: 'error' });
        }
    };

    const handleTogglePromotionActive = async (id: string) => {
        try {
            const promo = dashboardPromotions.find(p => p.id === id);
            if (!promo) return;
            await api.togglePromotionActive(id, !promo.active);
            const updated = await api.getPromotions('dashboard');
            setDashboardPromotions(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveRealEstatePromotion = async (promoData: Partial<RealEstatePromotion>) => {
        try {
            await api.savePromotion({ ...promoData, category: 'imoveis' });
            const updated = await api.getPromotions('imoveis');
            setRealEstatePromotions(updated);
            setToast({ message: 'Propaganda de Imóveis salva!', type: 'success' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteRealEstatePromotion = async (id: string) => {
        try {
            await api.deletePromotion(id);
            const updated = await api.getPromotions('imoveis');
            setRealEstatePromotions(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleRealEstatePromotionActive = async (id: string) => {
        try {
            const promo = realEstatePromotions.find(p => p.id === id);
            if (!promo) return;
            await api.togglePromotionActive(id, !promo.active);
            const updated = await api.getPromotions('imoveis');
            setRealEstatePromotions(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSavePartsServicesPromotion = async (promoData: Partial<PartsServicesPromotion>) => {
        try {
            await api.savePromotion({ ...promoData, category: 'pecas_servicos' });
            const updated = await api.getPromotions('pecas_servicos');
            setPartsServicesPromotions(updated);
            setToast({ message: 'Propaganda de Peças e Serviços salva!', type: 'success' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeletePartsServicesPromotion = async (id: string) => {
        try {
            await api.deletePromotion(id);
            const updated = await api.getPromotions('pecas_servicos');
            setPartsServicesPromotions(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleTogglePartsServicesPromotionActive = async (id: string) => {
        try {
            const promo = partsServicesPromotions.find(p => p.id === id);
            if (!promo) return;
            await api.togglePromotionActive(id, !promo.active);
            const updated = await api.getPromotions('pecas_servicos');
            setPartsServicesPromotions(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveVehiclesPromotion = async (promoData: Partial<VehiclesPromotion>) => {
        try {
            await api.savePromotion({ ...promoData, category: 'veiculos' });
            const updated = await api.getPromotions('veiculos');
            setVehiclesPromotions(updated);
            setToast({ message: 'Propaganda de Veículos salva!', type: 'success' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteVehiclesPromotion = async (id: string) => {
        try {
            await api.deletePromotion(id);
            const updated = await api.getPromotions('veiculos');
            setVehiclesPromotions(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleVehiclesPromotionActive = async (id: string) => {
        try {
            const promo = vehiclesPromotions.find(p => p.id === id);
            if (!promo) return;
            await api.togglePromotionActive(id, !promo.active);
            const updated = await api.getPromotions('veiculos');
            setVehiclesPromotions(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogin = (selectedUser: User) => {
        setUser(selectedUser);
        setCurrentScreen(Screen.DASHBOARD);
    };

    const handleLogout = async () => {
        try {
            setAuthLoading(true);
            await supabase.auth.signOut();
            setUser(null);
            setAuthLoading(false);
            setCurrentScreen(Screen.LOGIN);
        } catch (error) {
            console.error("❌ Erro ao deslogar:", error);
            setAuthLoading(false);
            setCurrentScreen(Screen.LOGIN);
        }
    };

    const handleRegister = async (newUserData: any) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: newUserData.email,
                password: newUserData.password,
                options: {
                    data: {
                        name: newUserData.name,
                        full_name: newUserData.name,
                        accepted_terms: true,
                        accepted_at: new Date().toISOString()
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                const newUser: User = {
                    id: data.user.id,
                    name: newUserData.name || 'Novo Usuário',
                    email: newUserData.email || '',
                    avatarUrl: "https://i.pravatar.cc/150?u=" + data.user.id,
                    balance: 0,
                    adsCount: 0,
                    phone: "",
                    location: "",
                    bio: "Novo no Feirão da Orca",
                    joinDate: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                    verified: false,
                    isAdmin: false,
                    // EXPLICIT: New users via registration flux already accepted terms
                    acceptedTerms: true,
                    acceptedAt: new Date().toISOString()
                };
                setUser(newUser);
                setToast({ message: "Conta criada com sucesso! Bem-vindo!", type: 'success' });
                setCurrentScreen(Screen.DASHBOARD);
            }
        } catch (error: any) {
            console.error("Erro registro:", error);
            setToast({ message: "Erro ao criar conta: " + error.message, type: 'error' });
        }
    };

    const navigateTo = (screen: Screen) => {
        setPreviousScreen(currentScreen);
        setCurrentScreen(screen);
    };

    const goBackToDashboard = () => setCurrentScreen(Screen.DASHBOARD);
    const goBackToPanel = () => setCurrentScreen(Screen.USER_PANEL);

    const handleSaveProfile = async (updatedUser: User) => {
        try {
            setToast({ message: "Salvando alterações...", type: 'info' });
            await api.updateProfile(updatedUser);

            // Somente atualiza localmente após sucesso no Supabase
            setUser(updatedUser);
            setToast({ message: "Perfil atualizado com sucesso!", type: 'success' });
            goBackToPanel();
        } catch (error) {
            console.error("❌ Erro ao salvar perfil:", error);
            setToast({ message: "Erro ao salvar perfil. Tente novamente.", type: 'error' });
        }
    };

    const handleToggleRole = () => {
        if (!user) return;
        const newRoleIsAdmin = !user.isAdmin;
        setUser((prev: User | null) => {
            if (!prev) return prev;
            return {
                ...prev,
                isAdmin: newRoleIsAdmin,
                name: newRoleIsAdmin ? "Administrador (Dev)" : "João Usuário",
                email: newRoleIsAdmin ? "admin@orca.com" : "joao@email.com"
            };
        });
        setToast({
            message: `Modo alterado para: ${newRoleIsAdmin ? 'Administrador' : 'Usuário Padrão'}`,
            type: 'success'
        });
    };

    const handleDeleteAd = async (id: string) => {
        if (!user || user.id === 'guest') {
            setToast({ message: "Usuário não autenticado", type: 'error' });
            return;
        }

        setToast({ message: "Excluindo anúncio...", type: 'info' });

        try {
            const { error } = await supabase
                .from('anuncios')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            // 1. Atualizar lista de Meus Anúncios
            setMyAds((prev: AdItem[]) => prev.filter(ad => ad.id !== id));

            // 2. Atualizar lista Global (Feed) se o anúncio estiver lá
            if (activeRealAds && setRealAds) {
                setRealAds((prev: AdItem[]) => prev.filter(ad => ad.id !== id));
            }

            setToast({ message: "Anúncio excluído com sucesso!", type: 'success' });
        } catch (error: any) {
            console.error("❌ Erro ao excluir anúncio:", error);
            setToast({ message: "Erro ao excluir: " + (error.message || "Erro desconhecido"), type: 'error' });
        }
    };

    const handleEditAd = async (ad: AdItem) => {
        // --- REGRA CRÍTICA: REMOVER DESTAQUE AO EDITAR ---
        const isTurboActive = ad.turbo_expires_at && new Date(ad.turbo_expires_at) > new Date();

        if (isTurboActive) {
            setToast({ message: "Removendo destaque para edição...", type: 'info' });
            try {
                // Sincroniza com o backend (força status pendente e remove expiração)
                await api.updateAd(ad.id, { 
                    turbo_expires_at: null,
                    status: AdStatus.PENDING 
                });

                // Atualiza estado local imediatamente
                const updatedAd = { 
                    ...ad, 
                    turbo_expires_at: null, 
                    status: AdStatus.PENDING,
                    isFeatured: false,
                    boostConfig: null 
                };

                setMyAds((prev: AdItem[]) => prev.map(a => a.id === ad.id ? updatedAd : a));
                
                // Prossegue para o editor com o objeto atualizado
                setAdToEdit(updatedAd);
            } catch (error) {
                console.error("❌ Erro ao remover destaque pré-edição:", error);
                setToast({ message: "Aviso: Não foi possível remover o destaque no servidor.", type: 'warning' });
                setAdToEdit(ad);
            }
        } else {
            setAdToEdit(ad);
        }

        setCameFromMyAds(true);
        setCurrentScreen(Screen.CREATE_AD);
    };

    const handleRemoveFavorite = async (id: string) => {
        // Atualização Otimista
        setFavorites((prev: AdItem[]) => prev.filter(item => item.id !== id));

        try {
            await api.removeFavorite(id);
            setToast({ message: "Anúncio removido dos favoritos.", type: 'info' });
        } catch (error) {
            console.error("❌ Erro ao remover favorito:", error);
            // Sincronizar com o banco para garantir consistência
            const freshFavs = await api.getFavorites();
            setFavorites(freshFavs);
        }
    };

    const handleToggleFavorite = async (ad: AdItem) => {
        const isFavorite = (favorites || []).some(item => item.id === ad.id);

        // Atualização Otimista
        setFavorites((prev: AdItem[]) => {
            const exists = prev.some(item => item.id === ad.id);
            if (exists) return prev.filter(item => item.id !== ad.id);
            return [...prev, ad];
        });

        try {
            if (isFavorite) {
                await api.removeFavorite(ad.id);
                setToast({ message: "Removido dos favoritos.", type: 'info' });
            } else {
                await api.addFavorite(ad.id);
                setToast({ message: "Adicionado aos favoritos! ❤️", type: 'success' });
            }
        } catch (error) {
            console.error("❌ Erro ao alternar favorito:", error);
            // Sincronizar com o banco para garantir consistência em caso de erro
            const freshFavs = await api.getFavorites();
            setFavorites(freshFavs);
            setToast({ message: "Erro ao atualizar favoritos.", type: 'error' });
        }
    };

    const handleAddReport = async (newReport: ReportItem) => {
        try {
            await api.createReport(newReport);

            // Still update locally for immediate UX
            setReports((prev: ReportItem[]) => [newReport, ...prev]);

            setToast({ message: "Sua denúncia foi enviada para análise. Obrigado por nos ajudar a manter a comunidade segura!", type: 'success' });
        } catch (error: any) {
            console.error("Erro ao enviar denúncia:", error);
            setToast({ message: "Erro ao enviar denúncia. Tente novamente mais tarde.", type: 'error' });
            throw error; // RE-THROW so the UI knows it failed
        }
    };

    const handleUpdatePrivacySettings = async (settings: { showOnlineStatus?: boolean, readReceipts?: boolean }) => {
        console.log("🔒 Atualizando configurações de privacidade:", settings);
        // Atualização Otimista
        setUser(prev => ({
            ...prev,
            ...settings
        }));

        try {
            await api.updatePrivacySettings(settings);
            setToast({ message: "Configurações de privacidade atualizadas!", type: 'success' });
        } catch (error) {
            console.error("❌ Erro ao atualizar privacidade:", error);
            setToast({ message: "Erro ao salvar privacidade. Tente novamente.", type: 'error' });
            // Rollback (Opcional: buscar perfil novamente)
            const freshProfile = await api.getProfile();
            if (freshProfile) setUser(freshProfile);
        }
    };

    const handleChangePassword = async (newPassword: string) => {
        try {
            await api.updatePassword(newPassword);
            setToast({ message: "Senha atualizada com sucesso!", type: 'success' });
        } catch (error: any) {
            console.error("❌ Erro ao trocar senha:", error);
            setToast({ message: "Erro ao atualizar senha: " + error.message, type: 'error' });
            throw error;
        }
    };

    const handleToggleFairPresence = async (ad: AdItem) => {
        if (!fairActive) {
            setToast({ message: "A feira não está ativa no momento.", type: 'error' });
            return;
        }

        const isMyAd = myAds.some((my: AdItem) => my.id === ad.id);
        if (!isMyAd) return;

        // Determinar novo estado
        const currentAd = myAds.find(m => m.id === ad.id);
        const newState = !currentAd?.fairPresence?.active;
        const newIsInFair = newState; // Mapeando para o campo do banco

        // Atualização Otimista
        setMyAds((prev: AdItem[]) => prev.map(item => {
            if (item.id === ad.id) {
                return {
                    ...item,
                    fairPresence: { active: newState, expiresAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString() },
                    isInFair: newIsInFair
                };
            }
            return item;
        }));

        // Atualizar também o selecionado se for o mesmo
        setSelectedAd((prev: AdItem | null) => {
            if (prev && prev.id === ad.id) {
                return {
                    ...prev,
                    fairPresence: { active: newState, expiresAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString() },
                    isInFair: newIsInFair
                };
            }
            return prev;
        });

        // Feedback Imediato
        if (newState) {
            setToast({ message: "Ativando presença na feira...", type: 'info' });
        }

        // Persistência
        try {
            await api.updateAnuncio(ad.id, { is_in_fair: newIsInFair });
            setToast({
                message: newState ? "Sua presença na feira foi ativada! 🚗" : "Modo feira desativado.",
                type: newState ? 'success' : 'info'
            });
        } catch (error) {
            console.error("❌ Erro ao atualizar presença na feira:", error);
            setToast({ message: "Erro ao salvar alteração. Tente novamente.", type: 'error' });

            // Rollback em caso de erro
            const originalState = !newState;
            setMyAds((prev: AdItem[]) => prev.map(item => {
                if (item.id === ad.id) {
                    return {
                        ...item,
                        fairPresence: { active: originalState, expiresAt: new Date().toISOString() },
                        isInFair: originalState
                    };
                }
                return item;
            }));
        }
    };

    const handleAdClick = (ad: AdItem) => {
        setPreviousScreen(currentScreen);

        // Defensive check for myAds array
        const safeMyAds = Array.isArray(myAds) ? myAds : [];
        const myAdVersion = safeMyAds.find((m: AdItem) => m.id === ad.id);

        const targetAd = myAdVersion || ad;
        setSelectedAd(targetAd);

        console.log("Navigating to ad:", targetAd.title, targetAd.category);

        if (ad.category === 'autos' || ad.category === 'veiculos') setCurrentScreen(Screen.VEHICLE_DETAILS);
        else if (ad.category === 'imoveis') setCurrentScreen(Screen.REAL_ESTATE_DETAILS);
        else if (ad.category === 'pecas' || ad.category === 'servicos' || ad.category === 'produtos') setCurrentScreen(Screen.PART_SERVICE_DETAILS);
        else setCurrentScreen(Screen.VEHICLE_DETAILS);
    };

    const handleViewProfile = async () => {
        if (!selectedAd) return;

        const { isBlockedBetween } = state;
        if (isBlockedBetween(user?.id || '', selectedAd.userId)) {
            setToast({ message: "O perfil deste usuário não está disponível devido a um bloqueio.", type: 'error' });
            return;
        }

        try {
            if (selectedAd.isOwner) {
                setViewingProfile({
                    ...user,
                    rating: 5.0,
                    joinDate: user.joinDate || "Recente",
                    verified: true,
                    location: user.location || "Localização não informada",
                    bio: user.bio || "Usuário do Feirão da Orca"
                });
            } else {
                // Fetch real public profile
                const publicProfile = await api.getPublicProfile(selectedAd.userId);

                if (publicProfile) {
                    setViewingProfile(publicProfile);
                } else {
                    // Generic fallback if fetch fails or blocked at DB level
                    setViewingProfile({
                        id: selectedAd.userId,
                        name: selectedAd.ownerName || 'Vendedor',
                        email: '',
                        avatarUrl: null,
                        balance: 0,
                        location: selectedAd.location || 'Brasil',
                        bio: 'Usuário do Feirão da Orca',
                        joinDate: 'Recente',
                        verified: false,
                        adsCount: 0
                    } as User);
                }
            }
        } catch (err) {
            console.error("Error navigating to profile:", err);
        } finally {
            setPreviousScreen(currentScreen);
            setCurrentScreen(Screen.PUBLIC_PROFILE);
        }
    };

    const handleViewProfileFromChat = async () => {
        if (!selectedChat) return;

        const { isBlockedBetween } = state;
        if (isBlockedBetween(user?.id || '', selectedChat.otherUserId)) {
            setToast({ message: "O perfil deste usuário não está disponível devido a um bloqueio.", type: 'error' });
            return;
        }

        try {
            // Fetch real public profile
            const publicProfile = await api.getPublicProfile(selectedChat.otherUserId);

            if (publicProfile) {
                setViewingProfile(publicProfile);
            } else {
                // Generic fallback if fetch fails
                setViewingProfile({
                    id: selectedChat.otherUserId,
                    name: selectedChat.senderName,
                    email: "", // Never expose email
                    avatarUrl: selectedChat.avatarUrl,
                    balance: 0,
                    phone: "",
                    location: "Localização não informada",
                    bio: "Usuário do Feirão da Orca",
                    joinDate: "Recente",
                    verified: false,
                    adsCount: 0
                } as User);
            }
        } catch (error) {
            console.error("Error viewing profile from chat:", error);
            // Minimal fallback
            setViewingProfile({
                id: selectedChat.otherUserId,
                name: selectedChat.senderName,
                email: "",
                avatarUrl: selectedChat.avatarUrl,
                balance: 0,
                location: "Localização não informada",
                bio: "Usuário do Feirão da Orca",
                joinDate: "Recente",
                verified: false,
                adsCount: 0
            } as User);
        } finally {
            setPreviousScreen(Screen.CHAT_DETAIL);
            setCurrentScreen(Screen.PUBLIC_PROFILE);
        }
    };

    const handleCreateAdFinish = async (adData: Partial<AdItem>, createdAd?: AdItem) => {
        try {
            if (adToEdit) {
                // Persistent Edit Logic (Zero Trust)
                setToast({ message: "Salvando alterações...", type: 'info' });

                try {
                    await api.updateAd(adToEdit.id, adData);

                    // Update Local State with merged data and status 'pendente'
                    setMyAds((prev: AdItem[]) => prev.map(ad => {
                        if (ad.id === adToEdit.id) {
                            return {
                                ...ad,
                                ...adData,
                                status: AdStatus.PENDING
                            };
                        }
                        return ad;
                    }));

                    // 🎯 FIX: Remover da lista global IMEDIATAMENTE após editar (evita info obsoleta no feed)
                    if (setRealAds) {
                        setRealAds((prev: AdItem[] = []) => prev.filter(ad => ad.id !== adToEdit.id));
                    }

                    setToast({ message: "Anúncio enviado para reanálise!", type: 'success' });
                } catch (updateError: any) {
                    console.error("❌ Erro ao persistir edição:", updateError);
                    setToast({ message: "Erro ao salvar: " + updateError.message, type: 'error' });
                    return; // Abort navigation on error
                }
            } else if (createdAd) {
                // --- FLOW: ANÚNCIO JÁ CRIADO (PAGO) ---
                // O anúncio já foi criado no CreateAd.tsx para permitir o pagamento imediato.
                // Apenas atualizamos o estado local e redirecionamos.
                setMyAds((prev: AdItem[]) => [createdAd, ...prev]);
                setToast({ message: "Anúncio publicado com sucesso!", type: 'success' });
            } else {
                // --- ZERO TRUST CREATION (GRÁTIS) ---
                setToast({ message: "Validando limite e criando...", type: 'info' });

                const payload: CreateAdPayload = {
                    ...adData,
                    title: adData.title || (adData as any).titulo || 'Sem Título',
                    description: adData.description || (adData as any).descricao || '',
                    price: adData.price || (adData as any).preco || 0,
                    category: adData.category || (adData as any).categoria || 'outros',
                    image: adData.image || (adData as any).imagens?.[0] || '',
                    images: (adData.images && adData.images.length > 0) ? adData.images : (adData.image ? [adData.image] : []),
                    location: adData.location || (adData as any).localizacao || ''
                };

                try {
                    const newAd = await api.createAd(payload);

                    setMyAds((prev: AdItem[]) => [newAd, ...prev]);
                    setToast({ message: "Anúncio criado com sucesso!", type: 'success' });

                    // CHECK FOR BOOST INTENTION (Legacy/Fallback if not handled in CreateAd)
                    if (adData.boostPlan && adData.boostPlan !== 'gratis') {
                        setPendingHighlightAd({ adId: newAd.id, planId: adData.boostPlan });
                        console.log("Setting pending highlight for:", newAd.id, adData.boostPlan);
                    }

                } catch (backendError: any) {
                    // Check if error is related to connection/availability (not limit reached)
                    // "failed to send a request to the edge function" is standard supabase-js error for connection failure
                    if (backendError.message?.includes('failed to send a request') || backendError.message?.includes('fetch failed')) {
                        console.warn("Backend unavailable, falling back to local creation.");

                        // Fallback: Create local mock ad
                        const localAd: AdItem = {
                            id: `local_${Date.now()}`,
                            ...payload,
                            status: AdStatus.PENDING,
                            createdAt: new Date().toISOString(),
                            // user.id might not be in payload, ensure owner is set
                            isOwner: true
                        } as AdItem;

                        setMyAds((prev: AdItem[]) => [localAd, ...prev]);
                        setToast({ message: "Backend offline. Anúncio criado localmente (modo dev).", type: 'warning' });
                    } else {
                        throw backendError; // Re-throw for outer catch to handle (e.g. Limit Exceeded)
                    }
                }
            }

            const { setMyAdsInitialTab } = state;
            const shouldGoBackToMyAds = cameFromMyAds;
            setCameFromMyAds(false);
            setMyAdsInitialTab('pendentes');
            setPreviousScreen(Screen.DASHBOARD);
            setCurrentScreen(Screen.MY_ADS);

        } catch (error: any) {
            console.error("Erro criação:", error);
            if (error.message?.includes('Limit Exceeded') || error.message?.includes('403')) {
                alert("LIMITE ATINGIDO (ZERO TRUST) 🔒\n\nVocê atingiu o limite de 3 anúncios gratuitos no mês.\nO servidor bloqueou esta ação.");
            } else {
                // Fallback for Development (if no backend) - Optional, but keeping strict per prompt instructions
                alert(`Erro do Servidor: ${error.message}\n(Backend Blindado impediu a criação)`);
            }
        }
    };

    const handleSubscribe = async (planId: string, price: number, title: string) => {
        try {
            setToast({ message: "Gerando checkout Mercado Pago...", type: 'info' });
            const { init_point } = await api.createPreference(planId, price, title);
            window.location.href = init_point;
        } catch (error: any) {
            setToast({ message: "Erro pagamento: " + error.message, type: 'error' });
        }
    };

    const handleAdminSaveAd = (updatedAd: AdItem) => {
        const isMyAd = myAds.some((ad: AdItem) => ad.id === updatedAd.id);

        if (isMyAd) {
            setMyAds((prev: AdItem[]) => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
        }



        // Mantém mocks admin sincronizados (fallback)
        setAdminMockAds((prev: AdItem[]) => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));

        setToast({ message: "Anúncio atualizado com sucesso!", type: 'success' });
    };

    const handleAdminAdUpdate = async (id: string, newStatus: AdStatus) => {
        try {
            // 1. Call real API first (Mandate: Confirm before UI feedback)
            setToast({ message: "Processando atualização no servidor...", type: 'info' });
            await api.adminUpdateAdStatus(id, newStatus);

            // 2. Local State Sync (only after DB success)
            const updateAdProps = (ad: AdItem) => {
                if (ad.id !== id) return ad;
                const updated = { ...ad, status: newStatus };
                if (newStatus === AdStatus.ACTIVE) {
                    if (ad.boostPlan && ad.boostPlan !== 'gratis') {
                        updated.isFeatured = true;
                    }
                    updated.fairPresence = { active: false, expiresAt: '' };
                }
                else if (newStatus === AdStatus.REJECTED) {
                    updated.isFeatured = false;
                    updated.fairPresence = { active: false, expiresAt: '' };
                }
                return updated;
            };

            const isMyAd = myAds.some((ad: AdItem) => ad.id === id);
            let targetAdTitle = '';

            if (isMyAd) {
                const target = myAds.find((ad: AdItem) => ad.id === id);
                targetAdTitle = target?.title || 'Seu anúncio';
                setMyAds((prev: AdItem[]) => prev.map(updateAdProps));
            }

            setAdminMockAds((prev: AdItem[]) => prev.map(updateAdProps));

            // CRÍTICO: Atualizar lista REAL de admins
            if (adminAds && setAdminAds) {
                setAdminAds((prev: AdItem[]) => prev.map(updateAdProps));
            }

            if (!targetAdTitle) {
                const target = adminMockAds.find((ad: AdItem) => ad.id === id);
                targetAdTitle = target?.title || 'Anúncio';
            }

            // 3. UI Feedback (Confirmed Success)
            if (newStatus === AdStatus.ACTIVE) {
                setToast({ message: "Anúncio APROVADO! Já está visível na plataforma.", type: 'success' });
            } else if (newStatus === AdStatus.REJECTED) {
                setToast({ message: "Anúncio Rejeitado.", type: 'error' });
            } else {
                setToast({ message: `Status alterado para: ${newStatus}`, type: 'info' });
            }

            const newNotification: NotificationItem = {
                id: Date.now(),
                type: 'system',
                title: newStatus === AdStatus.ACTIVE ? 'Anúncio Aprovado!' : 'Anúncio Rejeitado',
                message: newStatus === AdStatus.ACTIVE
                    ? `O anúncio "${targetAdTitle}" foi aprovado e já está online.`
                    : `O anúncio "${targetAdTitle}" não atendeu às diretrizes.`,
                time: 'Agora',
                unread: true,
                image: null
            };
            setNotifications((prev: NotificationItem[]) => [newNotification, ...prev]);

        } catch (error: any) {
            console.error("❌ Erro ao atualizar status do anúncio:", error);
            setToast({ message: "Falha na comunicação com o banco: Anúncio não atualizado.", type: 'error' });
        }
    };

    const handleModerationBlockUser = (userId: string, userName: string) => {
        setToast({ message: `Usuário "${userName}" (ID: ${userId}) foi bloqueado.`, type: 'success' });
        console.log('Blocked User:', userId);
    };

    const handleModerationDeleteAd = async (adId: string, adTitle: string, reportId?: string) => {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o anúncio "${adTitle}"?`)) return;

        try {
            // Chamada Real à API
            const result: any = await api.adminDeleteAd(adId, reportId);

            // Verifica se houve exclusão real (se a Edge Function retornar contagem)
            if (result && typeof result.deletedCount === 'number' && result.deletedCount === 0) {
                setToast({ message: `Aviso: O anúncio "${adTitle}" não foi encontrado no banco (provavelmente já excluído ou é Mock).`, type: 'warning' });
            } else {
                setToast({ message: `Anúncio "${adTitle}" excluído com sucesso.`, type: 'success' });
            }

            // Remove das listas locais
            setMyAds((prev: AdItem[]) => prev.filter(ad => ad.id !== adId));
            setAdminMockAds((prev: AdItem[]) => prev.filter(ad => ad.id !== adId));

            // Remove da lista REAL de admins
            if (adminAds && setAdminAds) {
                setAdminAds((prev: AdItem[]) => prev.filter(ad => ad.id !== adId));
            }

            // CRÍTICO: Remove do feed global de anúncios reais para sumir do Dashboard instantaneamente
            if (activeRealAds && setRealAds) {
                setRealAds((prev: AdItem[]) => prev.filter(ad => ad.id !== adId));
            }

            // Atualiza reports se necessário
            if (reportId) {
                setReports((prev: ReportItem[]) => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
            }

        } catch (error: any) {
            console.error("Erro ao excluir anúncio:", error);
            setToast({ message: "Erro ao excluir: " + error.message, type: 'error' });
        }
    };

    const handleReportAction = async (reportId: string, action: 'resolved' | 'dismissed') => {
        try {
            await api.updateReportStatus(reportId, action);

            setReports((prev: ReportItem[]) => prev.map(r => {
                if (r.id === reportId) {
                    return { ...r, status: action };
                }
                return r;
            }));

            setToast({
                message: action === 'dismissed' ? "Denúncia ignorada e removida da lista." : "Denúncia marcada como resolvida.",
                type: action === 'dismissed' ? 'info' : 'success'
            });
        } catch (error: any) {
            setToast({ message: "Erro ao atualizar denúncia: " + error.message, type: 'error' });
        }
    }

    const handleDeleteReport = async (reportId: string) => {
        if (!window.confirm("Deseja realmente EXCLUIR esta denúncia do banco de dados?")) return;

        try {
            await api.deleteReport(reportId);
            setReports((prev: ReportItem[]) => prev.filter(r => r.id !== reportId));
            setToast({ message: "Denúncia excluída permanentemente.", type: 'success' });
        } catch (error: any) {
            setToast({ message: "Erro ao excluir denúncia: " + error.message, type: 'error' });
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setAuthLoading(true);
            
            // 1. Backend deletion first (Mandatory per refined plan)
            await api.requestAccountDeletion();
            
            // 2. Clear session and state only after backend success
            await supabase.auth.signOut();
            setUser(null);
            setMyAds([]);
            setFavorites([]);
            
            setToast({ message: "Sua conta foi desativada com sucesso. Sentiremos sua falta!", type: 'success' });
            
            // 3. Navigation
            setCurrentScreen(Screen.LOGIN);
            localStorage.clear();
            
            setAuthLoading(false);
        } catch (error: any) {
            console.error("❌ Erro ao deletar conta:", error);
            setAuthLoading(false);
            setToast({ message: "Erro ao solicitar exclusão de conta. Tente novamente.", type: 'error' });
        }
    };

    const handleLoadConversations = async () => {
        const { blockedByMe, blockedByOthers } = state;
        const allBlocked = [...blockedByMe, ...blockedByOthers];
        
        const convs = await api.getUserConversations();
        
        // Filtragem front-end (Hardening)
        const filtered = convs.filter(c => !allBlocked.includes(c.otherUserId));
        setConversations(filtered);
    };

    const handleLoadMessages = async (adId: string, otherUserId: string) => {
        const { isBlockedBetween } = state;
        
        // Se houver bloqueio, não carregamos mensagens (Hardening)
        if (isBlockedBetween(user?.id || '', otherUserId)) {
            setChatMessages([]);
            return;
        }

        const msgs = await api.getChatMessages(adId, otherUserId);
        setChatMessages(msgs);
    };

    const handleBlockUser = async (blockedId: string) => {
        if (!user || user.id === 'guest') {
            setToast({ message: "Você precisa estar logado para bloquear um usuário.", type: 'error' });
            return;
        }

        if (user.id === blockedId) {
            setToast({ message: "Você não pode bloquear a si mesmo.", type: 'error' });
            return;
        }

        // Validação básica de UUID para evitar 400
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(blockedId)) {
            console.error("❌ ID de usuário inválido para bloqueio:", blockedId);
            setToast({ message: "Este usuário não pode ser bloqueado (ID inválido).", type: 'error' });
            return;
        }

        if (!window.confirm("Você não verá mais anúncios nem mensagens deste usuário, e ele também não verá os seus. Deseja continuar?")) return;

        try {
            await api.blockUser(blockedId);
            
            // Atualização de Estado Local
            const { setBlockedByMe, setRealAds, setConversations } = state;
            setBlockedByMe(prev => [...prev, blockedId]);
            
            // Re-filtrar listas imediatamente
            setRealAds((prev: AdItem[] = []) => prev.filter(ad => ad.userId !== blockedId));
            setConversations((prev: MessageItem[]) => prev.filter(c => c.otherUserId !== blockedId));

            setToast({ message: "Usuário bloqueado com sucesso.", type: 'success' });
            
            // Se estiver no chat ou detalhes dele, voltar
            if (currentScreen === Screen.CHAT_DETAIL || currentScreen === Screen.PUBLIC_PROFILE) {
                 setCurrentScreen(Screen.DASHBOARD);
            }
        } catch (error: any) {
            console.error("Erro ao bloquear:", error);
            setToast({ message: "Erro ao bloquear usuário.", type: 'error' });
        }
    };

    const handleUnblockUser = async (blockedId: string) => {
        if (!user || user.id === 'guest') return;

        try {
            await api.unblockUser(blockedId);
            
            // Atualização de Estado Local
            const { setBlockedByMe } = state;
            setBlockedByMe(prev => prev.filter(id => id !== blockedId));
            
            setToast({ message: "Usuário desbloqueado.", type: 'success' });
            
            // Recarregar dados globais para restaurar visibilidade
            handleLoadConversations();
            // handleLoadAds() - as listagens já recarregam via useEffect na maioria dos casos
        } catch (error: any) {
            console.error("Erro ao desbloquear:", error);
            setToast({ message: "Erro ao desbloquear usuário.", type: 'error' });
        }
    };

    const handleSendMessage = async (adId: string, receiverId: string, content: string, images?: string[]) => {
        if (!user || user.id === 'guest') return;

        // --- VALIDAÇÕES OBRIGATÓRIAS (PRÉ-ENVIO) ---
        if (!adId || !receiverId) {
            setToast({ message: "Erro: Destinatário ou Anúncio não identificado.", type: 'error' });
            return;
        }

        const trimmedContent = (content || "").trim();
        const hasImages = images && images.length > 0;

        if (!trimmedContent && !hasImages) {
            setToast({ message: "A mensagem não pode estar vazia", type: 'error' });
            return;
        }

        // Normalização de imagens
        const validImages = Array.isArray(images) ? images : [];

        // 0. VALIDAÇÃO LOCAL (Texto)
        if (trimmedContent.length > 0) {
            const words = trimmedContent.split(/\s+/);
            if (words.length > 50) {
                setToast({ message: "Limite de 50 palavras excedido", type: 'error' });
                return;
            }
            if (words.some(w => w.length > 30)) {
                setToast({ message: "Palavras muito longas não são permitidas", type: 'error' });
                return;
            }
            if (trimmedContent.length > 500) {
                setToast({ message: "Mensagem muito longa (máx 500 caracteres)", type: 'error' });
                return;
            }
        }

        // 0. VALIDAÇÃO LOCAL (Imagens)
        if (validImages.length > 3) {
            setToast({ message: "Máximo de 3 imagens por mensagem", type: 'error' });
            return;
        }

        const { isBlockedBetween } = state;
        if (isBlockedBetween(user.id, receiverId)) {
            setToast({ message: "Você não pode interagir com este usuário devido a um bloqueio.", type: 'error' });
            return;
        }

        // 1. OTIMISMO: Adicionar mensagem localmente IMEDIATAMENTE
        const tempId = `temp_${Date.now()}`;
        const optimisticMsg: ChatMessage = {
            id: tempId,
            text: trimmedContent,
            images: validImages,
            isMine: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: false,
            sending: true // Flag para feedback visual
        };

        setChatMessages(prev => [...prev, optimisticMsg]);

        try {
            console.log("📤 Enviando mensagem real para o banco...");
            const finalImages = (validImages && validImages.length > 0) ? validImages : null;
            await api.sendMessage(adId, receiverId, trimmedContent, finalImages || undefined);
            
            // 2. Sincronismo: Recarregar para pegar a ID real e timestamp do banco
            await handleLoadMessages(adId, receiverId);
            handleLoadConversations();
        } catch (error: any) {
            console.error("❌ Erro ao enviar mensagem (FULL):", JSON.stringify(error, null, 2));
            
            // Mostrar erro real do backend ou fallback amigável
            let errorMsg = error?.message || "Erro ao enviar mensagem. Verifique sua conexão.";
            
            // Mapeamento amigável para triggers conhecidos (opcional, já que mostramos o real agora)
            if (errorMsg.includes('SELF_CHAT_NOT_ALLOWED')) {
                errorMsg = "Você não pode enviar mensagens para si mesmo.";
            } else if (errorMsg.includes('MESSAGE_TOO_LONG')) {
                errorMsg = "Mensagem muito longa (Máximo 500 caracteres).";
            } else if (errorMsg.includes('TOO_MANY_IMAGES')) {
                errorMsg = "Máximo de 3 imagens permitido.";
            } else if (errorMsg.includes('WORD_TOO_LONG')) {
                errorMsg = "A mensagem contém palavras muito longas (> 30 caracteres).";
            } else if (errorMsg.includes('EMPTY_MESSAGE_NOT_ALLOWED')) {
                errorMsg = "A mensagem não pode estar vazia.";
            }

            setToast({ message: errorMsg, type: 'error' });

            // Marcar a mensagem como falha na UI
            setChatMessages(prev => prev.map(msg => 
                msg.id === tempId ? { ...msg, sending: false, error: true } : msg
            ));
        }
    };

    const handleSelectChat = async (chat: MessageItem) => {
        setSelectedChat(chat);

        // Identificar o adId correto (da conversa ou do anúncio selecionado)
        const adId = chat.adId || (selectedAd?.id);

        if (adId) {
            handleLoadMessages(adId, chat.otherUserId);
            // Marcar como lido no banco (aguardar persistência)
            await api.markMessagesAsRead(adId, chat.otherUserId);

            // OTIMIZAÇÃO: Limpar contador localmente IMEDIATAMENTE para feedback visual instantâneo
            setConversations(prev => prev.map(c =>
                (c.otherUserId === chat.otherUserId && c.adId === adId) ? { ...c, unreadCount: 0 } : c
            ));

            // Sincronizar o selectedAd para que o cabeçalho e navegação fiquem corretos
            try {
                const fullAd = await api.getAdById(adId);
                setSelectedAd(fullAd);
            } catch (e) {
                console.error("Erro ao sincronizar anúncio do chat:", e);
            }
        }

        setPreviousScreen(Screen.MESSAGES);
        setCurrentScreen(Screen.CHAT_DETAIL);
    };

    const handleStartChatFromAd = () => {
        if (!selectedAd) return;

        const existingChat = conversations.find(c => c.otherUserId === selectedAd.userId && c.adId === selectedAd.id);

        const chatToOpen: MessageItem = existingChat || {
            id: `new_${selectedAd.userId}_${selectedAd.id}`,
            otherUserId: selectedAd.userId,
            senderName: selectedAd.ownerName || 'Vendedor',
            avatarUrl: `https://ui-avatars.com/api/?name=${selectedAd.ownerName || 'V'}`,
            lastMessage: "",
            time: "Agora",
            unreadCount: 0,
            adTitle: selectedAd.title,
            adId: selectedAd.id,
            adImage: selectedAd.image,
            adPrice: selectedAd.price
        };

        setSelectedChat(chatToOpen);
        handleLoadMessages(selectedAd.id, selectedAd.userId);
        setPreviousScreen(currentScreen);
        setCurrentScreen(Screen.CHAT_DETAIL);
    };

    const navigateToAdDetails = () => {
        if (!selectedAd) {
            console.warn('selectedAd undefined');
            return;
        }
        setPreviousScreen(Screen.CHAT_DETAIL);
        handleAdClick(selectedAd);
    };

    const handleBackFromProfile = () => {
        if (previousScreen === Screen.CHAT_DETAIL) {
            setCurrentScreen(Screen.CHAT_DETAIL);
            return;
        }
        if (selectedAd) {
            if (selectedAd.isOwner) {
                setPreviousScreen(Screen.MY_ADS);
            } else {
                setPreviousScreen(Screen.DASHBOARD);
            }
            if (selectedAd.category === 'autos') setCurrentScreen(Screen.VEHICLE_DETAILS);
            else if (selectedAd.category === 'imoveis') setCurrentScreen(Screen.REAL_ESTATE_DETAILS);
            else if (selectedAd.category === 'pecas' || selectedAd.category === 'servicos') setCurrentScreen(Screen.PART_SERVICE_DETAILS);
            else setCurrentScreen(Screen.VEHICLE_DETAILS);
        } else {
            setCurrentScreen(Screen.DASHBOARD);
        }
    };

    const handleBackFromDetails = () => {
        setCurrentScreen(previousScreen);
    };

    const toggleFairActive = async (active: boolean) => {
        try {
            await api.updateSystemSetting({ fair_active: active });
            setToast({ message: `Seção da Feira ${active ? 'ativada' : 'desativada'} globalmente!`, type: 'info' });
        } catch (error) {
            console.error("❌ Erro ao atualizar status da feira:", error);
            setToast({ message: "Erro ao atualizar configuração global.", type: 'error' });
        }
    };

    const toggleMaintenanceMode = async (active: boolean) => {
        try {
            await api.updateSystemSetting({ maintenance_mode: active });
            setToast({ message: `Modo Manutenção ${active ? 'ativado' : 'desativado'} globalmente!`, type: 'info' });
        } catch (error) {
            console.error("❌ Erro ao atualizar modo manutenção:", error);
            setToast({ message: "Erro ao atualizar configuração global.", type: 'error' });
        }
    };

    const prepareCreateAd = (ad?: AdItem) => {
        setAdToEdit(ad);
        if (!ad) setCameFromMyAds(false);
        setCurrentScreen(Screen.CREATE_AD);
    };

    // --- HOME NAVIGATION ACTIONS ---
    const openNewArrivals = () => {
        setFilterContext({ mode: 'recent', sort: 'recent' });
        navigateTo(Screen.VEHICLES_LIST);
    };

    const openAutomotiveServices = () => {
        navigateTo(Screen.PARTS_SERVICES_LIST);
    };

    const openTrendingRealEstate = () => {
        setFilterContext({ mode: 'trending', sort: 'trending' });
        navigateTo(Screen.REAL_ESTATE_LIST);
    };

    const handleClearNotifications = () => {
        if (!notifications || notifications.length === 0) {
            setToast({ message: "Nenhuma notificação para limpar", type: 'info' });
            return;
        }

        const confirmed = window.confirm("Tem certeza que deseja limpar todas as notificações?");
        
        if (!confirmed) return;

        setNotifications(() => []);
        
        setToast({ message: "Notificações limpas com sucesso", type: 'success' });
    };

    return {
        handleLogin,
        handleLogout,
        handleRegister,
        navigateTo,
        setCurrentScreen, // Added for flexibility but preferred to use named actions
        setPreviousScreen,
        goBackToDashboard,
        goBackToPanel,
        handleBackFromProfile,
        handleBackFromDetails,
        handleSaveProfile,
        handleToggleRole,
        handleDeleteAd,
        handleEditAd,
        handleRemoveFavorite,
        handleToggleFavorite,
        handleAddReport,
        handleToggleFairPresence,
        handleAdClick,
        handleViewProfile,
        handleViewProfileFromChat,
        handleCreateAdFinish,
        // handleSubscribe, // REMOVED
        handleAdminSaveAd,
        handleAdminAdUpdate,
        handleModerationBlockUser,
        handleModerationDeleteAd,
        handleReportAction,
        handleDeleteReport,
        handleDeleteAccount,
        handleSelectChat,
        handleStartChatFromAd,
        navigateToAdDetails,
        toggleFairActive,
        toggleMaintenanceMode,
        prepareCreateAd,
        openNewArrivals,
        openAutomotiveServices,
        openTrendingRealEstate,
        setAdToEdit,
        handleUpdatePrivacySettings,
        handleChangePassword,

        handleSavePromotion,
        handleDeletePromotion,
        handleTogglePromotionActive,

        handleSaveRealEstatePromotion,
        handleDeleteRealEstatePromotion,
        handleToggleRealEstatePromotionActive,

        handleSavePartsServicesPromotion,
        handleDeletePartsServicesPromotion,
        handleTogglePartsServicesPromotionActive,

        handleSaveVehiclesPromotion,
        handleDeleteVehiclesPromotion,
        handleToggleVehiclesPromotionActive,
        handleForgotPassword,

        favorites,
        setToast,
        adToEdit,
        conversations,
        chatMessages,
        handleSendMessage,
        handleLoadMessages,
        handleLoadConversations,
        handleBlockUser,
        handleUnblockUser,
        handleClearNotifications,
        handleAcceptTerms
    };
};
