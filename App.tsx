
import React, { useState, useEffect } from 'react';
import { Screen, User, AdItem, AdStatus, MessageItem, BannerItem, NotificationItem, ReportItem } from './types';
import { CURRENT_USER, MY_ADS_DATA, FAVORITES_DATA, HISTORY_DATA, HISTORY_CHART_DATA, MESSAGES_DATA, POPULAR_CARS, POPULAR_REAL_ESTATE, POPULAR_SERVICES, FEATURED_VEHICLES, DEFAULT_BANNERS, DEFAULT_VEHICLE_BANNERS, DEFAULT_REAL_ESTATE_BANNERS, DEFAULT_PARTS_SERVICES_BANNERS, MOCK_ADMIN_VEHICLES, MOCK_NOTIFICATIONS, MOCK_REPORTS, MOCK_ADMIN_REAL_ESTATE, MOCK_ADMIN_PARTS_SERVICES, APP_LOGOS } from './constants';
import { BottomNav, Toast } from './components/Shared';
import { Wrench, Shield, LogOut } from 'lucide-react';

// Screens
import { AppRouter } from './components/AppRouter';

// --- HELPER PARA CARREGAR DADOS SALVOS ---
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Erro ao carregar ${key} do armazenamento`, error);
    return fallback;
  }
};

// --- MOCK SELLER FOR DEMO ---
export const MOCK_SELLER: User = {
  name: "Marcos Paulo",
  email: "marcos@email.com",
  avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200",
  balance: 0,
  phone: "(61) 99999-8888",
  location: "Águas Claras, DF",
  bio: "Apaixonado por carros e motos. Vendo apenas veículos de procedência.",
  rating: 4.8,
  joinDate: "Ago 2022",
  reviewsCount: 14,
  verified: true
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [previousScreen, setPreviousScreen] = useState<Screen>(Screen.DASHBOARD);

  // Initialize state from LocalStorage
  const [user, setUser] = useState<User>(() => loadFromStorage('orca_user', CURRENT_USER));
  const [myAds, setMyAds] = useState<AdItem[]>(() => loadFromStorage('orca_my_ads', MY_ADS_DATA));
  const [favorites, setFavorites] = useState<AdItem[]>(() => loadFromStorage('orca_favorites', FAVORITES_DATA));
  const [banners, setBanners] = useState<BannerItem[]>(() => loadFromStorage('orca_banners', DEFAULT_BANNERS));
  const [vehicleBanners, setVehicleBanners] = useState<BannerItem[]>(() => loadFromStorage('orca_vehicle_banners', DEFAULT_VEHICLE_BANNERS));
  const [realEstateBanners, setRealEstateBanners] = useState<BannerItem[]>(() => loadFromStorage('orca_real_estate_banners', DEFAULT_REAL_ESTATE_BANNERS));
  const [partsServicesBanners, setPartsServicesBanners] = useState<BannerItem[]>(() => loadFromStorage('orca_parts_services_banners', DEFAULT_PARTS_SERVICES_BANNERS));

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadFromStorage('orca_notifications', MOCK_NOTIFICATIONS));
  const [reports, setReports] = useState<ReportItem[]>(() => loadFromStorage('orca_reports', MOCK_REPORTS));

  // Configurações do Sistema
  const [fairActive, setFairActive] = useState<boolean>(() => loadFromStorage('orca_fair_active', true));
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => loadFromStorage('orca_maintenance', false));

  // Estado local para anúncios do admin (mocks)
  const [adminMockAds, setAdminMockAds] = useState<AdItem[]>(MOCK_ADMIN_VEHICLES);

  // States for flow
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [adToEdit, setAdToEdit] = useState<AdItem | undefined>(undefined); // State for the ad currently being edited
  const [selectedChat, setSelectedChat] = useState<MessageItem | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // --- FILTRAGEM E COMPOSIÇÃO DE DADOS ---

  // 1. Meus Anúncios Ativos (Visíveis para o público)
  const activeMyAds = myAds.filter(ad => ad.status === AdStatus.ACTIVE);

  // 2. Todos os Anúncios Ativos Globais (Populares + Meus Ativos + Destaques)
  const combinedRawAds = [
    ...activeMyAds,
    ...FEATURED_VEHICLES,
    ...POPULAR_CARS,
    ...POPULAR_REAL_ESTATE,
    ...POPULAR_SERVICES
  ];

  // Dedup por ID
  const allAds = Array.from(new Map(combinedRawAds.map(item => [item.id, item])).values());

  // 3. Lista para o Dashboard (Veículos Recentes)
  const dashboardVehicleAds = [...activeMyAds.filter(ad => ad.category === 'autos'), ...POPULAR_CARS];

  // 4. Destaques (Apenas Ativos)
  const displayFeaturedAds = [
    ...activeMyAds.filter(ad => ad.isFeatured),
    ...FEATURED_VEHICLES
  ];

  // 5. Veículos na Feira (Apenas Ativos)
  const fairAds = allAds.filter(ad => {
    if (!ad.fairPresence?.active) return false;
    const expires = new Date(ad.fairPresence.expiresAt);
    return expires > new Date();
  });

  // 6. Lista Completa para o Admin
  const allAdminVehicleAds = [...myAds.filter(ad => ad.category === 'autos'), ...adminMockAds];

  // 7. Lista UNIFICADA para MODERAÇÃO
  const allModerationAds = [
    ...myAds,
    ...adminMockAds,
    ...MOCK_ADMIN_REAL_ESTATE,
    ...MOCK_ADMIN_PARTS_SERVICES,
    ...FEATURED_VEHICLES,
    ...POPULAR_CARS,
    ...POPULAR_REAL_ESTATE,
    ...POPULAR_SERVICES
  ];

  // --- PERSISTÊNCIA ---
  useEffect(() => localStorage.setItem('orca_user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('orca_my_ads', JSON.stringify(myAds)), [myAds]);
  useEffect(() => localStorage.setItem('orca_favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('orca_banners', JSON.stringify(banners)), [banners]);
  useEffect(() => localStorage.setItem('orca_vehicle_banners', JSON.stringify(vehicleBanners)), [vehicleBanners]);
  useEffect(() => localStorage.setItem('orca_real_estate_banners', JSON.stringify(realEstateBanners)), [realEstateBanners]);
  useEffect(() => localStorage.setItem('orca_parts_services_banners', JSON.stringify(partsServicesBanners)), [partsServicesBanners]);
  useEffect(() => localStorage.setItem('orca_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('orca_reports', JSON.stringify(reports)), [reports]);
  useEffect(() => localStorage.setItem('orca_fair_active', JSON.stringify(fairActive)), [fairActive]);
  useEffect(() => localStorage.setItem('orca_maintenance', JSON.stringify(maintenanceMode)), [maintenanceMode]);

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

  // --- DEV TOOLS: TOGGLE ROLE ---
  const handleToggleRole = () => {
    const newRoleIsAdmin = !user.isAdmin;
    setUser(prev => ({
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
    setMyAds(prev => prev.filter(ad => ad.id !== id));
  };

  const handleEditAd = (ad: AdItem) => {
    setAdToEdit(ad);
    setCurrentScreen(Screen.CREATE_AD);
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleFavorite = (ad: AdItem) => {
    setFavorites(prev => {
      const exists = prev.some(item => item.id === ad.id);
      if (exists) return prev.filter(item => item.id !== ad.id);
      return [...prev, ad];
    });
  };

  const handleAddReport = (newReport: ReportItem) => {
    setReports(prev => [newReport, ...prev]);
  };

  const handleToggleFairPresence = (ad: AdItem) => {
    if (!fairActive) {
      setToast({ message: "A feira não está ativa no momento.", type: 'error' });
      return;
    }

    const isMyAd = myAds.some(my => my.id === ad.id);
    if (!isMyAd) return;

    let isActivating = false;

    setMyAds(prev => prev.map(item => {
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

    setSelectedAd(prev => {
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
    const myAdVersion = myAds.find(m => m.id === ad.id);
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

    // Creates a temporary user profile based on chat data
    const profileUser: User = {
      id: selectedChat.id,
      name: selectedChat.senderName,
      email: "usuario@chat.com", // Mock email
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
      setMyAds(prev => prev.map(ad => {
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
      setMyAds(prev => [newAd, ...prev]);
      setToast({ message: "Anúncio criado e enviado para análise!", type: 'info' });
    }

    setPreviousScreen(Screen.DASHBOARD);
    setCurrentScreen(Screen.MY_ADS);
  };

  const handleAdminSaveAd = (updatedAd: AdItem) => {
    const isMyAd = myAds.some(ad => ad.id === updatedAd.id);

    if (isMyAd) {
      setMyAds(prev => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
    } else {
      setAdminMockAds(prev => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
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

    const isMyAd = myAds.some(ad => ad.id === id);
    let targetAdTitle = '';

    if (isMyAd) {
      const target = myAds.find(ad => ad.id === id);
      targetAdTitle = target?.title || 'Seu anúncio';
      setMyAds(prev => prev.map(updateAdProps));
    } else {
      const target = adminMockAds.find(ad => ad.id === id);
      targetAdTitle = target?.title || 'Seu anúncio';
      setAdminMockAds(prev => prev.map(updateAdProps));
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
    setNotifications(prev => [newNotification, ...prev]);
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
    setReports(prev => prev.map(r => {
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

  // --- LOGIC: MAINTENANCE MODE INTERCEPTOR ---
  // Se manutenção estiver ativa E usuário NÃO for admin E não estiver na tela de login
  // Mostra tela de bloqueio
  if (maintenanceMode && !user.isAdmin && currentScreen !== Screen.LOGIN && currentScreen !== Screen.REGISTER && currentScreen !== Screen.FORGOT_PASSWORD) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl mb-8 relative">
          <img src={APP_LOGOS.ICON} alt="Orca Logo" className="w-20 h-20 opacity-50" />
          <div className="absolute -bottom-2 -right-2 bg-red-100 p-3 rounded-full border-4 border-gray-50">
            <Wrench className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aplicativo em Manutenção</h1>
        <p className="text-gray-600 max-w-xs mb-8 leading-relaxed">
          Estamos realizando melhorias no sistema. O Feirão da Orca voltará em breve com novidades!
        </p>

        <div className="w-full max-w-xs space-y-3">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
            <p className="flex items-center justify-center gap-2 font-bold mb-1">
              <Shield className="w-4 h-4" /> Acesso Administrativo
            </p>
            Se você é administrador, faça login para acessar o painel.
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Entrar como Admin
          </button>
        </div>
      </div>
    );
  }

  const showBottomNav = currentScreen !== Screen.LOGIN && currentScreen !== Screen.REGISTER && currentScreen !== Screen.FORGOT_PASSWORD && currentScreen !== Screen.EDIT_PROFILE && currentScreen !== Screen.CHANGE_PASSWORD && currentScreen !== Screen.CREATE_AD && currentScreen !== Screen.VEHICLE_DETAILS && currentScreen !== Screen.REAL_ESTATE_DETAILS && currentScreen !== Screen.PART_SERVICE_DETAILS && currentScreen !== Screen.PUBLIC_PROFILE && currentScreen !== Screen.CHAT_DETAIL && currentScreen !== Screen.ADMIN_PANEL && currentScreen !== Screen.ADMIN_USERS && currentScreen !== Screen.ADMIN_VEHICLES && currentScreen !== Screen.ADMIN_REAL_ESTATE && currentScreen !== Screen.ADMIN_PARTS_SERVICES && currentScreen !== Screen.ADMIN_REPORTS && currentScreen !== Screen.ADMIN_BANNERS && currentScreen !== Screen.ADMIN_SYSTEM_SETTINGS && currentScreen !== Screen.ADMIN_CONTENT_MODERATION;

  const unreadMessagesCount = MESSAGES_DATA.reduce((total, msg) => total + (msg.unreadCount || 0), 0);

  return (
    <div className="bg-gray-50 min-h-screen text-slate-800 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <AppRouter
        currentScreen={currentScreen}
        user={user}
        onLogin={handleLogin}
        onForgotPassword={() => setCurrentScreen(Screen.FORGOT_PASSWORD)}
        onRegister={() => setCurrentScreen(Screen.REGISTER)}
        onBackToLogin={() => setCurrentScreen(Screen.LOGIN)}
        handleRegister={handleRegister}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
        handleAdClick={handleAdClick}
        fairAds={fairAds}
        banners={banners}
        displayFeaturedAds={displayFeaturedAds}
        dashboardVehicleAds={dashboardVehicleAds}
        fairActive={fairActive}
        handleToggleRole={handleToggleRole}
        handleSaveProfile={handleSaveProfile}
        goBackToPanel={goBackToPanel}
        myAds={myAds}
        handleDeleteAd={handleDeleteAd}
        handleEditAd={handleEditAd}
        setAdToEdit={setAdToEdit}
        goBackToDashboard={goBackToDashboard}
        handleCreateAdFinish={handleCreateAdFinish}
        adToEdit={adToEdit}
        allAds={allAds}
        vehicleBanners={vehicleBanners}
        favorites={favorites}
        handleToggleFavorite={handleToggleFavorite}
        realEstateBanners={realEstateBanners}
        partsServicesBanners={partsServicesBanners}
        viewingProfile={viewingProfile}
        previousScreen={previousScreen}
        setCurrentScreen={setCurrentScreen}
        selectedAd={selectedAd}
        setPreviousScreen={setPreviousScreen}
        handleStartChatFromAd={handleStartChatFromAd}
        handleAddReport={handleAddReport}
        handleToggleFairPresence={handleToggleFairPresence}
        handleViewProfile={handleViewProfile}
        handleRemoveFavorite={handleRemoveFavorite}
        handleSelectChat={handleSelectChat}
        selectedChat={selectedChat}
        navigateToAdDetails={navigateToAdDetails}
        handleViewProfileFromChat={handleViewProfileFromChat}
        notifications={notifications}
        handleDeleteAccount={handleDeleteAccount}
        allAdminVehicleAds={allAdminVehicleAds}
        handleAdminAdUpdate={handleAdminAdUpdate}
        setBanners={setBanners}
        setVehicleBanners={setVehicleBanners}
        realEstateBannersState={realEstateBanners}
        setRealEstateBanners={setRealEstateBanners}
        partsServicesBannersState={partsServicesBanners}
        setPartsServicesBanners={setPartsServicesBanners}
        onToggleFair={setFairActive}
        maintenanceMode={maintenanceMode}
        onToggleMaintenance={setMaintenanceMode}
        handleModerationBlockUser={handleModerationBlockUser}
        handleModerationDeleteAd={handleModerationDeleteAd}
        reports={reports}
        handleReportAction={handleReportAction}
        allModerationAds={allModerationAds}
        handleAdminSaveAd={handleAdminSaveAd}
      />

      {showBottomNav && <BottomNav currentScreen={currentScreen} onNavigate={navigateTo} unreadCount={unreadMessagesCount} />}
    </div>
  );
};


export default App;
