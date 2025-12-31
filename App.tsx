
import React from 'react';
import { Screen, User, AdItem, AdStatus, MessageItem, NotificationItem, ReportItem, BannerItem } from './types';
import { CURRENT_USER, MY_ADS_DATA, FAVORITES_DATA, HISTORY_DATA, HISTORY_CHART_DATA, MESSAGES_DATA, POPULAR_CARS, POPULAR_REAL_ESTATE, POPULAR_SERVICES, FEATURED_VEHICLES, DEFAULT_BANNERS, DEFAULT_VEHICLE_BANNERS, DEFAULT_REAL_ESTATE_BANNERS, DEFAULT_PARTS_SERVICES_BANNERS, MOCK_ADMIN_VEHICLES, MOCK_NOTIFICATIONS, MOCK_REPORTS, MOCK_ADMIN_REAL_ESTATE, MOCK_ADMIN_PARTS_SERVICES, APP_LOGOS } from './constants';
import { MOCK_SELLER } from './src/constants';
import { BottomNav, Toast } from './components/Shared';
import { Wrench, Shield, LogOut } from 'lucide-react';

// Screens
import { AppRouter } from './components/AppRouter';
import { useAppState } from './hooks/useAppState';
import { useAppActions } from './hooks/useAppActions';


const App: React.FC = () => {
  const state = useAppState();
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

  const {
    handleLogin,
    handleLogout,
    handleRegister,
    navigateTo,
    goBackToDashboard,
    goBackToPanel,
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
    navigateToAdDetails
  } = useAppActions(state);

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
