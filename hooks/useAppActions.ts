import { Screen, User, AdItem, AdStatus, MessageItem, NotificationItem, ReportItem, DashboardPromotion, RealEstatePromotion, PartsServicesPromotion, VehiclesPromotion } from '../types';
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

        notifications, setNotifications,
        reports, setReports,
        fairActive, setFairActive,
        maintenanceMode, setMaintenanceMode,
        adminMockAds, setAdminMockAds,
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
        vehiclesPromotions, setVehiclesPromotions
    } = state;

    // Fix for Stale State in Event Handlers
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const handleSavePromotion = (promoData: Partial<DashboardPromotion>) => {
        const startDate = new Date(promoData.startDate || '');
        const endDate = new Date(promoData.endDate || '');

        if (endDate <= startDate) {
            setToast({ message: "A data de término deve ser posterior à data de início.", type: 'error' });
            return;
        }

        const activeCount = dashboardPromotions.filter(p => p.active && p.id !== promoData.id).length;
        if (promoData.active) {
            if (activeCount >= 5) {
                setToast({ message: "Limite máximo de 5 banners ativos atingido.", type: 'error' });
                return;
            }
            const today = new Date();
            if (today > new Date(promoData.endDate || '')) {
                setToast({ message: "Não é possível ativar uma propaganda com data vencida.", type: 'error' });
                return;
            }
        }

        if (promoData.id) {
            // Update mode
            setDashboardPromotions((prev: DashboardPromotion[]) => prev.map(p =>
                p.id === promoData.id ? {
                    ...p,
                    title: promoData.title ?? p.title,
                    subtitle: promoData.subtitle ?? p.subtitle,
                    image: promoData.image ?? p.image,
                    link: promoData.link ?? p.link,
                    startDate: promoData.startDate ?? p.startDate,
                    endDate: promoData.endDate ?? p.endDate,
                    active: promoData.active ?? p.active,
                    order: promoData.order ?? p.order,
                    updatedAt: new Date().toISOString()
                } : p
            ));
            setToast({ message: "Propaganda atualizada com sucesso!", type: 'success' });
        } else {
            // Create mode
            const newPromo: DashboardPromotion = {
                id: `promo_${Date.now()}`,
                title: promoData.title || '',
                subtitle: promoData.subtitle || '',
                image: promoData.image || '',
                link: promoData.link || '#',
                startDate: promoData.startDate || new Date().toISOString(),
                endDate: promoData.endDate || new Date().toISOString(),
                active: promoData.active ?? true,
                order: dashboardPromotions.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setDashboardPromotions((prev: DashboardPromotion[]) => [...prev, newPromo]);
            setToast({ message: "Propaganda criada com sucesso!", type: 'success' });
        }
    };

    const handleDeletePromotion = (id: string) => {
        setDashboardPromotions((prev: DashboardPromotion[]) => prev.filter(p => p.id !== id));
        setToast({ message: "Propaganda excluída.", type: 'info' });
    };

    const handleTogglePromotionActive = (id: string) => {
        const promo = dashboardPromotions.find(p => p.id === id);
        if (!promo) return;

        if (!promo.active) {
            const activeCount = dashboardPromotions.filter(p => p.active).length;
            if (activeCount >= 5) {
                setToast({ message: "Limite máximo de 5 banners ativos atingido.", type: 'error' });
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(promo.endDate);
            end.setHours(23, 59, 59, 999);

            if (today > end) {
                setToast({ message: "Não é possível ativar uma propaganda com data vencida.", type: 'error' });
                return;
            }
        }

        setDashboardPromotions((prev: DashboardPromotion[]) => prev.map(p =>
            p.id === id ? { ...p, active: !p.active, updatedAt: new Date().toISOString() } : p
        ));
    };

    const handleSaveRealEstatePromotion = (promoData: Partial<RealEstatePromotion>) => {
        const startDate = new Date(promoData.startDate || '');
        const endDate = new Date(promoData.endDate || '');

        if (endDate <= startDate) {
            setToast({ message: "A data de término deve ser posterior à data de início.", type: 'error' });
            return;
        }

        const activeCount = realEstatePromotions.filter(p => p.active && p.id !== promoData.id).length;
        if (promoData.active) {
            if (activeCount >= 5) {
                setToast({ message: "Limite máximo de 5 banners ativos atingido.", type: 'error' });
                return;
            }
            const today = new Date();
            if (today > new Date(promoData.endDate || '')) {
                setToast({ message: "Não é possível ativar uma propaganda com data vencida.", type: 'error' });
                return;
            }
        }

        if (promoData.id) {
            // Update mode
            setRealEstatePromotions((prev: RealEstatePromotion[]) => prev.map(p =>
                p.id === promoData.id ? {
                    ...p,
                    title: promoData.title ?? p.title,
                    subtitle: promoData.subtitle ?? p.subtitle,
                    image: promoData.image ?? p.image,
                    link: promoData.link ?? p.link,
                    startDate: promoData.startDate ?? p.startDate,
                    endDate: promoData.endDate ?? p.endDate,
                    active: promoData.active ?? p.active,
                    order: promoData.order ?? p.order,
                    updatedAt: new Date().toISOString()
                } : p
            ));
            setToast({ message: "Propaganda atualizada com sucesso!", type: 'success' });
        } else {
            // Create mode
            const newPromo: RealEstatePromotion = {
                id: `re_promo_${Date.now()}`,
                title: promoData.title || '',
                subtitle: promoData.subtitle || '',
                image: promoData.image || '',
                link: promoData.link || '#',
                startDate: promoData.startDate || new Date().toISOString(),
                endDate: promoData.endDate || new Date().toISOString(),
                active: promoData.active ?? true,
                order: realEstatePromotions.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setRealEstatePromotions((prev: RealEstatePromotion[]) => [...prev, newPromo]);
            setToast({ message: "Propaganda criada com sucesso!", type: 'success' });
        }
    };

    const handleDeleteRealEstatePromotion = (id: string) => {
        setRealEstatePromotions((prev: RealEstatePromotion[]) => prev.filter(p => p.id !== id));
        setToast({ message: "Propaganda excluída.", type: 'info' });
    };

    const handleToggleRealEstatePromotionActive = (id: string) => {
        const promo = realEstatePromotions.find(p => p.id === id);
        if (!promo) return;

        if (!promo.active) {
            const activeCount = realEstatePromotions.filter(p => p.active).length;
            if (activeCount >= 5) {
                setToast({ message: "Limite máximo de 5 banners ativos atingido.", type: 'error' });
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(promo.endDate);
            end.setHours(23, 59, 59, 999);

            if (today > end) {
                setToast({ message: "Não é possível ativar uma propaganda com data vencida.", type: 'error' });
                return;
            }
        }

        setRealEstatePromotions((prev: RealEstatePromotion[]) => prev.map(p =>
            p.id === id ? { ...p, active: !p.active, updatedAt: new Date().toISOString() } : p
        ));
    };

    const handleSavePartsServicesPromotion = (promoData: Partial<PartsServicesPromotion>) => {
        const startDate = new Date(promoData.startDate || '');
        const endDate = new Date(promoData.endDate || '');

        if (endDate <= startDate) {
            setToast({ message: "A data de término deve ser posterior à data de início.", type: 'error' });
            return;
        }

        const activeCount = partsServicesPromotions.filter(p => p.active && p.id !== promoData.id).length;
        if (promoData.active) {
            if (activeCount >= 5) {
                setToast({ message: "Limite máximo de 5 banners ativos atingido.", type: 'error' });
                return;
            }
            const today = new Date();
            if (today > new Date(promoData.endDate || '')) {
                setToast({ message: "Não é possível ativar uma propaganda com data vencida.", type: 'error' });
                return;
            }
        }

        if (promoData.id) {
            // Update mode
            setPartsServicesPromotions((prev: PartsServicesPromotion[]) => prev.map(p =>
                p.id === promoData.id ? {
                    ...p,
                    title: promoData.title ?? p.title,
                    subtitle: promoData.subtitle ?? p.subtitle,
                    image: promoData.image ?? p.image,
                    link: promoData.link ?? p.link,
                    startDate: promoData.startDate ?? p.startDate,
                    endDate: promoData.endDate ?? p.endDate,
                    active: promoData.active ?? p.active,
                    order: promoData.order ?? p.order,
                    updatedAt: new Date().toISOString()
                } : p
            ));
            setToast({ message: "Propaganda atualizada com sucesso!", type: 'success' });
        } else {
            // Create mode
            const newPromo: PartsServicesPromotion = {
                id: `ps_promo_${Date.now()}`,
                title: promoData.title || '',
                subtitle: promoData.subtitle || '',
                image: promoData.image || '',
                link: promoData.link || '#',
                startDate: promoData.startDate || new Date().toISOString(),
                endDate: promoData.endDate || new Date().toISOString(),
                active: promoData.active ?? true,
                order: partsServicesPromotions.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setPartsServicesPromotions((prev: PartsServicesPromotion[]) => [...prev, newPromo]);
            setToast({ message: "Propaganda criada com sucesso!", type: 'success' });
        }
    };

    const handleDeletePartsServicesPromotion = (id: string) => {
        setPartsServicesPromotions((prev: PartsServicesPromotion[]) => prev.filter(p => p.id !== id));
        setToast({ message: "Propaganda excluída.", type: 'info' });
    };

    const handleTogglePartsServicesPromotionActive = (id: string) => {
        const promo = partsServicesPromotions.find(p => p.id === id);
        if (!promo) return;

        if (!promo.active) {
            const activeCount = partsServicesPromotions.filter(p => p.active).length;
            if (activeCount >= 5) {
                setToast({ message: "Limite máximo de 5 banners ativos atingido.", type: 'error' });
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(promo.endDate);
            end.setHours(23, 59, 59, 999);

            if (today > end) {
                setToast({ message: "Não é possível ativar uma propaganda com data vencida.", type: 'error' });
                return;
            }
        }

        setPartsServicesPromotions((prev: PartsServicesPromotion[]) => prev.map(p =>
            p.id === id ? { ...p, active: !p.active, updatedAt: new Date().toISOString() } : p
        ));
    };

    const handleSaveVehiclesPromotion = (promoData: Partial<VehiclesPromotion>) => {
        const startDate = new Date(promoData.startDate || '');
        const endDate = new Date(promoData.endDate || '');

        if (endDate <= startDate) {
            setToast({ message: "A data de término deve ser posterior à data de início.", type: 'error' });
            return;
        }

        const activeCount = vehiclesPromotions.filter(p => p.active && p.id !== promoData.id).length;
        if (promoData.active) {
            if (activeCount >= 5) {
                setToast({ message: "Limite máximo de 5 banners ativos atingido.", type: 'error' });
                return;
            }
            const today = new Date();
            if (today > new Date(promoData.endDate || '')) {
                setToast({ message: "Não é possível ativar uma propaganda com data vencida.", type: 'error' });
                return;
            }
        }

        if (promoData.id) {
            // Update mode
            setVehiclesPromotions((prev: VehiclesPromotion[]) => prev.map(p =>
                p.id === promoData.id ? {
                    ...p,
                    title: promoData.title ?? p.title,
                    subtitle: promoData.subtitle ?? p.subtitle,
                    image: promoData.image ?? p.image,
                    link: promoData.link ?? p.link,
                    startDate: promoData.startDate ?? p.startDate,
                    endDate: promoData.endDate ?? p.endDate,
                    active: promoData.active ?? p.active,
                    order: promoData.order ?? p.order,
                    updatedAt: new Date().toISOString()
                } : p
            ));
            setToast({ message: "Propaganda atualizada com sucesso!", type: 'success' });
        } else {
            // Create mode
            const newPromo: VehiclesPromotion = {
                id: `vehicles_promo_${Date.now()}`,
                title: promoData.title || '',
                subtitle: promoData.subtitle || '',
                image: promoData.image || '',
                link: promoData.link || '#',
                startDate: promoData.startDate || new Date().toISOString(),
                endDate: promoData.endDate || new Date().toISOString(),
                active: promoData.active ?? true,
                order: vehiclesPromotions.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setVehiclesPromotions((prev: VehiclesPromotion[]) => [...prev, newPromo]);
            setToast({ message: "Propaganda criada com sucesso!", type: 'success' });
        }
    };

    const handleDeleteVehiclesPromotion = (id: string) => {
        setVehiclesPromotions((prev: VehiclesPromotion[]) => prev.filter(p => p.id !== id));
        setToast({ message: "Propaganda excluída.", type: 'info' });
    };

    const handleToggleVehiclesPromotionActive = (id: string) => {
        const promo = vehiclesPromotions.find(p => p.id === id);
        if (!promo) return;

        if (!promo.active) {
            const activeCount = vehiclesPromotions.filter(p => p.active).length;
            if (activeCount >= 5) {
                setToast({ message: "Limite máximo de 5 banners ativos atingido.", type: 'error' });
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(promo.endDate);
            end.setHours(23, 59, 59, 999);

            if (today > end) {
                setToast({ message: "Não é possível ativar uma propaganda com data vencida.", type: 'error' });
                return;
            }
        }

        setVehiclesPromotions((prev: VehiclesPromotion[]) => prev.map(p =>
            p.id === id ? { ...p, active: !p.active, updatedAt: new Date().toISOString() } : p
        ));
    };

    const handleLogin = (selectedUser: User) => {
        setUser(selectedUser);
        setCurrentScreen(Screen.DASHBOARD);
    };

    const handleLogout = () => setCurrentScreen(Screen.LOGIN);

    const handleRegister = async (newUserData: any) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: newUserData.email,
                password: newUserData.password,
                options: {
                    data: {
                        name: newUserData.name,
                        full_name: newUserData.name,
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
                    location: "Brasília, DF",
                    bio: "Novo no Feirão da Orca",
                    joinDate: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                    verified: false,
                    isAdmin: false,
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
        setCameFromMyAds(true);
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

        // Defensive check for myAds array
        const safeMyAds = Array.isArray(myAds) ? myAds : [];
        const myAdVersion = safeMyAds.find((m: AdItem) => m.id === ad.id);

        const targetAd = myAdVersion || ad;
        setSelectedAd(targetAd);

        console.log("Navigating to ad:", targetAd.title, targetAd.category);

        if (ad.category === 'autos' || ad.category === 'veiculos') setCurrentScreen(Screen.VEHICLE_DETAILS);
        else if (ad.category === 'imoveis') setCurrentScreen(Screen.REAL_ESTATE_DETAILS);
        else if (ad.category === 'pecas' || ad.category === 'servicos') setCurrentScreen(Screen.PART_SERVICE_DETAILS);
        else setCurrentScreen(Screen.VEHICLE_DETAILS);
    };

    const handleViewProfile = async () => {
        if (!selectedAd) return;

        try {
            if (selectedAd.isOwner) {
                setViewingProfile({
                    ...user,
                    rating: 5.0,
                    joinDate: user.joinDate || "Mar 2023",
                    verified: true,
                    location: user.location || "Brasília, DF",
                    bio: user.bio || "Usuário do Feirão da Orca"
                });
            } else {
                // Fetch real public profile
                const publicProfile = await api.getPublicProfile(selectedAd.userId);

                if (publicProfile) {
                    setViewingProfile(publicProfile);
                } else {
                    // Generic fallback if fetch fails
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

    const handleCreateAdFinish = async (adData: Partial<AdItem>) => {
        try {
            if (adToEdit) {
                // Edit Logic (Simplification: Editing allows direct update if RLS permits, or use a function)
                // For now, let's keep local edit logic OR map to API update if exists.
                // The requirements focused on CREATE limits.
                // Let's assume edit is still local for this mock migration step or basic API update.
                // NOTE: User said "ZERO TRUST". Editing active ads usually requires moderation too. 
                // But let's stick to the prompt focus: Create Ad & Limits.
                // To avoid breaking the whole app instantly without backend, I will wrap in try/catch.

                // Existing Edit Logic (Preserved for now but ideally should be api.updateAd)
                setMyAds((prev: AdItem[]) => prev.map(ad => {
                    if (ad.id === adToEdit.id) {
                        return {
                            ...ad,
                            ...adData,
                            status: AdStatus.PENDING // Re-approve on edit?
                        };
                    }
                    return ad;
                }));
                setToast({ message: "Anúncio atualizado!", type: 'success' });
            } else {
                // --- ZERO TRUST CREATION ---
                setToast({ message: "Validando limite e criando...", type: 'info' });

                const payload: CreateAdPayload = {
                    title: adData.title || 'Sem Título',
                    description: adData.description || '',
                    price: adData.price || 0,
                    category: adData.category || 'outros',
                    image: adData.image || '',
                    location: adData.location || '',
                    ...adData
                };

                try {
                    const newAd = await api.createAd(payload);

                    setMyAds((prev: AdItem[]) => [newAd, ...prev]);
                    setToast({ message: "Anúncio criado com sucesso!", type: 'success' });
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
        }


        setAdminMockAds((prev: AdItem[]) => prev.map(updateAdProps));

        if (!targetAdTitle) {
            const target = adminMockAds.find((ad: AdItem) => ad.id === id);
            targetAdTitle = target?.title || 'Anúncio';
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
        handleSubscribe,
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
        openNewArrivals,
        openAutomotiveServices,
        openTrendingRealEstate,
        setAdToEdit,

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

        favorites,
        setToast,
        adToEdit,
    };
};
