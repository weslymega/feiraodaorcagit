
import { Screen, User, AdItem, AdStatus, MessageItem, NotificationItem, ReportItem } from '../types';
import { CURRENT_USER, MY_ADS_DATA, FAVORITES_DATA, DEFAULT_BANNERS, DEFAULT_VEHICLE_BANNERS, DEFAULT_REAL_ESTATE_BANNERS, DEFAULT_PARTS_SERVICES_BANNERS, MOCK_NOTIFICATIONS, MOCK_REPORTS } from '../constants';
import { MOCK_SELLER } from '../src/constants';
import { AppState } from '../types/AppState';

export const useAppActions = (state: AppState) => {
    const {
        currentScreen, setCurrentScreen,
        previousScreen, setPreviousScreen,
        user, setUser,
        myAds, setMyAds,
        favorites, setFavorites,
        banners, setBanners,
        vehicleBanners, setVehicleBanners,
        realEstateBanners, setRealEstateBanners,
        partsServicesBanners, setPartsServicesBanners,
        notifications, setNotifications,
        reports, setReports,
        fairActive, setFairActive,
        maintenanceMode, setMaintenanceMode,
        adminMockAds, setAdminMockAds,
        selectedAd, setSelectedAd,
        adToEdit, setAdToEdit,
        selectedChat, setSelectedChat,
        viewingProfile, setViewingProfile,
        toast, setToast
    } = state;

    const handleLogin = (selectedUser: User) => {
        setUser(selectedUser);
        setCurrentScreen(Screen.DASHBOARD);
    };

    const handleLogout = () => setCurrentScreen(Screen.LOGIN);

    const handleRegister = (newUserData: Partial<User>) => {
        const newUser: User = {
            id: `user_${Date.now()}`,
            name: newUserData.name || 'Novo Usuário',
            email: newUserData.email || '',
            avatarUrl: "https://i.pravatar.cc/150?u=new_user",
            balance: 0,
            adsCount: 0,
            phone: "",
            location: "Brasília, DF",
            bio: "Novo no Feirão da Orca",
            joinDate: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            verified: false,
            isAdmin: false,
            ...newUserData
        };
        setUser(newUser);
        setToast({ message: "Conta criada com sucesso! Bem-vindo!", type: 'success' });
        setCurrentScreen(Screen.DASHBOARD);
    };

    const navigateTo = (screen: Screen) => {
        setPreviousScreen(currentScreen);
        setCurrentScreen(screen);
    };

    const goBackToDashboard = () => setCurrentScreen(Screen.DASHBOARD);
    const goBackToPanel = () => setCurrentScreen(Screen.USER_PANEL);

    const handleSaveProfile = (updatedUser: User) => {
        setUser(updatedUser);
        goBackToPanel();
    };

    const handleToggleRole = () => {
        const newRoleIsAdmin = !user.isAdmin;
        setUser((prev: User) => ({
            ...prev,
            isAdmin: newRoleIsAdmin,
            name: newRoleIsAdmin ? "Administrador (Dev)" : "João Usuário",
            email: newRoleIsAdmin ? "admin@orca.com" : "joao@email.com"
        }));
        setToast({
            message: `Modo alterado para: ${newRoleIsAdmin ? 'Administrador' : 'Usuário Padrão'}`,
            type: 'success'
        });
    };

    const handleDeleteAd = (id: string) => {
        setMyAds((prev: AdItem[]) => prev.filter(ad => ad.id !== id));
    };

    const handleEditAd = (ad: AdItem) => {
        setAdToEdit(ad);
        setCurrentScreen(Screen.CREATE_AD);
    };

    const handleRemoveFavorite = (id: string) => {
        setFavorites((prev: AdItem[]) => prev.filter(item => item.id !== id));
    };

    const handleToggleFavorite = (ad: AdItem) => {
        setFavorites((prev: AdItem[]) => {
            const exists = prev.some(item => item.id === ad.id);
            if (exists) return prev.filter(item => item.id !== ad.id);
            return [...prev, ad];
        });
    };

    const handleAddReport = (newReport: ReportItem) => {
        setReports((prev: ReportItem[]) => [newReport, ...prev]);
    };

    const handleToggleFairPresence = (ad: AdItem) => {
        if (!fairActive) {
            setToast({ message: "A feira não está ativa no momento.", type: 'error' });
            return;
        }

        const isMyAd = myAds.some((my: AdItem) => my.id === ad.id);
        if (!isMyAd) return;

        let isActivating = false;

        setMyAds((prev: AdItem[]) => prev.map(item => {
            if (item.id === ad.id) {
                if (item.fairPresence?.active) {
                    isActivating = false;
                    return {
                        ...item,
                        fairPresence: { active: false, expiresAt: new Date().toISOString() }
                    };
                } else {
                    isActivating = true;
                    const now = new Date();
                    const expireTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
                    return {
                        ...item,
                        fairPresence: { active: true, expiresAt: expireTime.toISOString() }
                    };
                }
            }
            return item;
        }));

        if (isActivating) {
            setToast({ message: "Sua presença na feira foi ativada! 🚗", type: 'success' });
        } else {
            setToast({ message: "Modo feira desativado.", type: 'info' });
        }

        setSelectedAd((prev: AdItem | null) => {
            if (prev && prev.id === ad.id) {
                const isActive = prev.fairPresence?.active;
                const now = new Date();
                const expireTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
                return {
                    ...prev,
                    fairPresence: isActive
                        ? { active: false, expiresAt: new Date().toISOString() }
                        : { active: true, expiresAt: expireTime.toISOString() }
                };
            }
            return prev;
        });
    };

    const handleAdClick = (ad: AdItem) => {
        setPreviousScreen(currentScreen);
        const myAdVersion = myAds.find((m: AdItem) => m.id === ad.id);
        setSelectedAd(myAdVersion || ad);

        if (ad.category === 'autos') setCurrentScreen(Screen.VEHICLE_DETAILS);
        else if (ad.category === 'imoveis') setCurrentScreen(Screen.REAL_ESTATE_DETAILS);
        else if (ad.category === 'pecas' || ad.category === 'servicos') setCurrentScreen(Screen.PART_SERVICE_DETAILS);
        else setCurrentScreen(Screen.VEHICLE_DETAILS);
    };

    const handleViewProfile = () => {
        if (!selectedAd) return;
        if (selectedAd.isOwner) {
            setViewingProfile({ ...user, rating: 5.0, joinDate: "Mar 2023", verified: true });
        } else {
            setViewingProfile(MOCK_SELLER);
        }
        setPreviousScreen(currentScreen);
        setCurrentScreen(Screen.PUBLIC_PROFILE);
    };

    const handleViewProfileFromChat = () => {
        if (!selectedChat) return;

        const profileUser: User = {
            id: selectedChat.id,
            name: selectedChat.senderName,
            email: "usuario@chat.com",
            avatarUrl: selectedChat.avatarUrl,
            balance: 0,
            phone: "",
            location: "Brasília, DF",
            bio: "Usuário do Feirão da Orca",
            joinDate: "Recente",
            verified: false,
            adsCount: 0
        };

        setViewingProfile(profileUser);
        setPreviousScreen(Screen.CHAT_DETAIL);
        setCurrentScreen(Screen.PUBLIC_PROFILE);
    };

    const handleCreateAdFinish = (adData: Partial<AdItem>) => {
        if (adToEdit) {
            setMyAds((prev: AdItem[]) => prev.map(ad => {
                if (ad.id === adToEdit.id) {
                    return {
                        ...ad,
                        ...adData,
                        status: AdStatus.PENDING,
                        id: adToEdit.id,
                        image: adData.images && adData.images.length > 0 ? adData.images[0] : ad.image
                    };
                }
                return ad;
            }));
            setToast({ message: "Anúncio atualizado e enviado para análise!", type: 'success' });
            setAdToEdit(undefined);
        } else {
            const newAd: AdItem = {
                id: `ad_${Date.now()}`,
                title: "Novo Anúncio",
                price: 0,
                location: user.location || "Brasília, DF",
                image: "https://picsum.photos/400/300",
                status: AdStatus.PENDING,
                date: new Date().toLocaleDateString('pt-BR'),
                category: 'autos',
                isOwner: true,
                ownerName: user.name,
                ...adData,
            };
            setMyAds((prev: AdItem[]) => [newAd, ...prev]);
            setToast({ message: "Anúncio criado e enviado para análise!", type: 'info' });
        }

        setPreviousScreen(Screen.DASHBOARD);
        setCurrentScreen(Screen.MY_ADS);
    };

    const handleAdminSaveAd = (updatedAd: AdItem) => {
        const isMyAd = myAds.some((ad: AdItem) => ad.id === updatedAd.id);

        if (isMyAd) {
            setMyAds((prev: AdItem[]) => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
        } else {
            setAdminMockAds((prev: AdItem[]) => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
        }
        setToast({ message: "Anúncio atualizado com sucesso!", type: 'success' });
    };

    const handleAdminAdUpdate = (id: string, newStatus: AdStatus) => {
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
        } else {
            const target = adminMockAds.find((ad: AdItem) => ad.id === id);
            targetAdTitle = target?.title || 'Seu anúncio';
            setAdminMockAds((prev: AdItem[]) => prev.map(updateAdProps));
        }

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
    };

    const handleModerationBlockUser = (userId: string, userName: string) => {
        setToast({ message: `Usuário "${userName}" (ID: ${userId}) foi bloqueado.`, type: 'success' });
        console.log('Blocked User:', userId);
    };

    const handleModerationDeleteAd = (adId: string, adTitle: string) => {
        handleAdminAdUpdate(adId, AdStatus.REJECTED);
        setToast({ message: `Anúncio "${adTitle}" foi removido por violação.`, type: 'success' });
    };

    const handleReportAction = (reportId: string, action: 'resolved' | 'dismissed') => {
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
    }

    const handleDeleteAccount = () => {
        if (window.confirm("Tem certeza absoluta? Isso apagará seus dados locais.")) {
            localStorage.clear();
            setUser(CURRENT_USER);
            setMyAds(MY_ADS_DATA);
            setFavorites(FAVORITES_DATA);
            setBanners(DEFAULT_BANNERS);
            setVehicleBanners(DEFAULT_VEHICLE_BANNERS);
            setRealEstateBanners(DEFAULT_REAL_ESTATE_BANNERS);
            setPartsServicesBanners(DEFAULT_PARTS_SERVICES_BANNERS);
            setNotifications(MOCK_NOTIFICATIONS);
            setReports(MOCK_REPORTS);
            setFairActive(true);
            setMaintenanceMode(false);
            alert("Sua conta e dados locais foram redefinidos.");
            handleLogout();
        }
    };

    const handleSelectChat = (chat: MessageItem) => {
        setSelectedChat(chat);
        setPreviousScreen(Screen.MESSAGES);
        setCurrentScreen(Screen.CHAT_DETAIL);
    };

    const handleStartChatFromAd = () => {
        if (!selectedAd) return;
        const newChat: MessageItem = {
            id: `new_${Date.now()}`,
            senderName: selectedAd.isOwner ? user.name : MOCK_SELLER.name,
            avatarUrl: selectedAd.isOwner ? user.avatarUrl : MOCK_SELLER.avatarUrl,
            lastMessage: "Tenho interesse no seu anúncio",
            time: "Agora",
            unreadCount: 0,
            online: true,
            adTitle: selectedAd.title
        };
        setSelectedChat(newChat);
        setPreviousScreen(currentScreen);
        setCurrentScreen(Screen.CHAT_DETAIL);
    };

    const navigateToAdDetails = () => {
        if (!selectedAd) return;
        setPreviousScreen(Screen.CHAT_DETAIL);
        if (selectedAd.category === 'autos') setCurrentScreen(Screen.VEHICLE_DETAILS);
        else if (selectedAd.category === 'imoveis') setCurrentScreen(Screen.REAL_ESTATE_DETAILS);
        else if (selectedAd.category === 'pecas' || selectedAd.category === 'servicos') setCurrentScreen(Screen.PART_SERVICE_DETAILS);
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

    const toggleFairActive = (active: boolean) => setFairActive(active);
    const toggleMaintenanceMode = (active: boolean) => setMaintenanceMode(active);

    const prepareCreateAd = (ad?: AdItem) => {
        setAdToEdit(ad);
        setCurrentScreen(Screen.CREATE_AD);
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
        handleAdminSaveAd,
        handleAdminAdUpdate,
        handleModerationBlockUser,
        handleModerationDeleteAd,
        handleReportAction,
        handleDeleteAccount,
        handleSelectChat,
        handleStartChatFromAd,
        navigateToAdDetails,
        toggleFairActive,
        toggleMaintenanceMode,
        prepareCreateAd,
        setBanners,
        setVehicleBanners,
        setRealEstateBanners,
        setPartsServicesBanners,
        setAdToEdit,
        favorites, // FIX: Added favorites to fix blank screen navigation error
        setToast, // Also adding setToast for completeness
        adToEdit, // Also adding adToEdit for completeness
        banners, // Also adding banners for completeness
        vehicleBanners, // Also adding vehicleBanners for completeness
        realEstateBanners, // Also adding realEstateBanners for completeness
        partsServicesBanners // Also adding partsServicesBanners for completeness
    };
};
