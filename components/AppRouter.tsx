
import React from 'react';
import { Screen, AdItem, AdStatus, NotificationItem } from '../types';
import {
    HISTORY_DATA,
    HISTORY_CHART_DATA,
    MESSAGES_DATA,
    POPULAR_CARS,
    POPULAR_REAL_ESTATE,
    POPULAR_SERVICES,
    FEATURED_VEHICLES,
    MOCK_ADMIN_REAL_ESTATE,
    MOCK_ADMIN_PARTS_SERVICES,
    APP_LOGOS,
    MOCK_SELLER
} from '../constants';

import { AppState } from '../types/AppState';
import { AppActions } from '../types/AppActions';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPassword } from '../screens/ForgotPassword';
import { Dashboard } from '../screens/Dashboard';
import { UserPanel } from '../screens/UserPanel';
import { MyAds } from '../screens/MyAds';
import { Favorites } from '../screens/Favorites';
import { History } from '../screens/History';
import { Settings } from '../screens/Settings';
import { Messages } from '../screens/Messages';
import { EditProfile } from '../screens/EditProfile';
import { ChangePassword } from '../screens/ChangePassword';
import { ResetPassword } from '../screens/ResetPassword';
import { CreateAd } from '../screens/CreateAd';
import { VehicleDetails } from '../screens/VehicleDetails';
import { RealEstateDetails } from '../screens/RealEstateDetails';
import { PartServiceDetails } from '../screens/PartServiceDetails';
import { AccountData } from '../screens/AccountData';
import { Notifications } from '../screens/Notifications';
import { Privacy } from '../screens/Privacy';
import { Security } from '../screens/Security';
import { AboutApp } from '../screens/AboutApp';
import { HelpSupport } from '../screens/HelpSupport';
import { AboutUs } from '../screens/AboutUs';
import { TermsOfUse } from '../screens/TermsOfUse';
import { PrivacyPolicy } from '../screens/PrivacyPolicy';
import { ChatDetail } from '../screens/ChatDetail';
import { VehiclesList } from '../screens/VehiclesList';
import { RealEstateList } from '../screens/RealEstateList';
import { PartsServicesList } from '../screens/PartsServicesList';
import { FeaturedVehiclesScreen } from '../screens/FeaturedVehiclesScreen';
import { FairList } from '../screens/FairList';
import { PublicProfile } from '../screens/PublicProfile';
import { AdminPanel } from '../screens/AdminPanel';
import { AdminUsers } from '../screens/AdminUsers';
import { AdminVehicleAds } from '../screens/AdminVehicleAds';
import { AdminRealEstateAds } from '../screens/AdminRealEstateAds';
import { AdminPartsServicesAds } from '../screens/AdminPartsServicesAds';
import { AdminReports } from '../screens/AdminReports';
import { AdminSystemSettings } from '../screens/AdminSystemSettings';
import { AdminContentModeration } from '../screens/AdminContentModeration';
import { AdminDashboardPromotions } from '../screens/AdminDashboardPromotions';
import { AdminRealEstatePromotions } from '../screens/AdminRealEstatePromotions';
import { AdminPartsServicesPromotions } from '../screens/AdminPartsServicesPromotions';
import { AdminVehiclesPromotions } from '../screens/AdminVehiclesPromotions';

import { Wrench, Shield } from 'lucide-react';
import { BottomNav, Toast } from '../components/Shared';
import { ErrorBoundary } from './ErrorBoundary';

interface AppRouterProps {
    state: AppState;
    actions: AppActions;
}

export const AppRouter: React.FC<AppRouterProps> = ({ state, actions }) => {
    const {
        currentScreen, setCurrentScreen, user, maintenanceMode, myAds, adminMockAds,
        fairActive, selectedAd, previousScreen, selectedChat,
        viewingProfile, notifications, reports,
        dashboardPromotions, realEstatePromotions, partsServicesPromotions, vehiclesPromotions
    } = state;

    const {
        handleLogin, handleLogout, handleRegister, navigateTo, handleAdClick,
        goBackToDashboard, goBackToPanel, handleSaveProfile,
        handleToggleRole, handleDeleteAd, handleEditAd,
        handleCreateAdFinish, handleToggleFavorite, favorites,
        handleStartChatFromAd, handleAddReport, handleToggleFairPresence,
        handleViewProfile, handleRemoveFavorite, handleSelectChat,
        navigateToAdDetails, handleViewProfileFromChat, handleDeleteAccount,
        handleAdminAdUpdate, handleModerationBlockUser, handleModerationDeleteAd,
        handleReportAction, handleDeleteReport, handleAdminSaveAd,
        handleSavePromotion, handleDeletePromotion, handleTogglePromotionActive,
        handleSaveRealEstatePromotion, handleDeleteRealEstatePromotion, handleToggleRealEstatePromotionActive,
        handleSavePartsServicesPromotion, handleDeletePartsServicesPromotion, handleTogglePartsServicesPromotionActive,
        handleSaveVehiclesPromotion, handleDeleteVehiclesPromotion, handleToggleVehiclesPromotionActive,
        handleSaveAd, handleDeleteAd: deleteAdAction, handleToggleAdStatus, handleToggleFairActive,
        handleToggleFairStatus, handleSaveUser, handleDeleteUser, handleToggleUserBlock,
        handleMarkNotificationRead, handleDeleteNotification, handleResolveReport,
        handleToggleMaintenanceMode,
        toggleFairActive, toggleMaintenanceMode: toggleMaintenanceModeAction, prepareCreateAd,
        openNewArrivals, openAutomotiveServices, openTrendingRealEstate,
        handleSendMessage, handleUpdatePrivacySettings, handleChangePassword,
        handleForgotPassword
    } = actions;

    const handleBackFromDetails = () => {
        if (previousScreen &&
            previousScreen !== currentScreen &&
            previousScreen !== Screen.LOGIN &&
            previousScreen !== Screen.REGISTER) {
            // Use setCurrentScreen directly to avoid updating history in a loop
            setCurrentScreen(previousScreen);
        } else {
            goBackToDashboard();
        }
    };

    const handleBackFromProfile = () => {
        if (previousScreen &&
            previousScreen !== currentScreen &&
            previousScreen !== Screen.LOGIN &&
            previousScreen !== Screen.REGISTER) {
            setCurrentScreen(previousScreen);
        } else {
            goBackToDashboard();
        }
    };

    // --- FILTRAGEM E COMPOSIÇÃO DE DADOS (REAL DATA from Supabase) ---

    // Desestruturar ads reais do estado
    const { activeRealAds, adminAds } = state;

    // 1. Meus Anúncios Ativos (já filtrados no hook ou aqui)
    const activeMyAds = myAds.filter(ad => ad.status === AdStatus.ACTIVE);

    // 2. Todos os Anúncios Ativos Globais (Vindo do Supabase)
    const allAds = activeRealAds;

    // 3. Lista para o Dashboard (Veículos)
    const dashboardVehicleAds = activeRealAds.filter(ad =>
        ad.category === 'veiculos'
    ).slice(0, 20);

    // 4. Destaques (Reais Pagos/Destaques)
    const displayFeaturedAds = activeRealAds.filter(ad =>
        ad.category === 'veiculos' &&
        (ad.isFeatured || (ad.boostPlan && ad.boostPlan !== 'gratis'))
    );

    // 5. Veículos na Feira (Lógica Atualizada)
    const fairAds = activeRealAds.filter(ad =>
        ad.category === 'veiculos' && ad.isInFair === true
    );

    // 6. Lista Completa para o Admin - Veículos
    const allAdminVehicleAds = Array.isArray(adminAds) ? adminAds.filter(ad => ad.category === 'veiculos' || ad.category === 'autos') : [];

    // 7. Lista Completa para o Admin - Imóveis
    const allAdminRealEstateAds = Array.isArray(adminAds) ? adminAds.filter(ad => ad.category === 'imoveis') : [];

    // 8. Lista UNIFICADA para MODERAÇÃO
    const allModerationAds = Array.isArray(adminAds) ? adminAds : [];

    // 9. Lista Completa para o Admin - Peças e Serviços
    const allAdminPartsServicesAds = Array.isArray(adminAds) ? adminAds.filter(ad => ad.category === 'pecas' || ad.category === 'servicos') : [];

    // 10. Lista Destaque para Dashboard (Imóveis)
    const dashboardRealEstateAds = activeRealAds.filter(ad =>
        ad.category === 'imoveis' &&
        (ad.isFeatured || (ad.boostPlan && ad.boostPlan !== 'gratis'))
    ).slice(0, 5);

    // Fallback se não tiver destaques, mostrar recentes
    if (dashboardRealEstateAds.length === 0) {
        dashboardRealEstateAds.push(...activeRealAds.filter(ad => ad.category === 'imoveis').slice(0, 5));
    }

    // 11. Lista para Página de Peças e Serviços
    const serviceAds = activeRealAds.filter(ad =>
        ad.category === 'servicos' || ad.category === 'pecas'
    );

    // --- LÓGICA DE MANUTENÇÃO (Moved from App.tsx) ---
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
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    const showBottomNav = currentScreen !== Screen.LOGIN && currentScreen !== Screen.REGISTER && currentScreen !== Screen.FORGOT_PASSWORD && currentScreen !== Screen.EDIT_PROFILE && currentScreen !== Screen.CHANGE_PASSWORD && currentScreen !== Screen.CREATE_AD && currentScreen !== Screen.VEHICLE_DETAILS && currentScreen !== Screen.REAL_ESTATE_DETAILS && currentScreen !== Screen.PART_SERVICE_DETAILS && currentScreen !== Screen.PUBLIC_PROFILE && currentScreen !== Screen.CHAT_DETAIL && currentScreen !== Screen.ADMIN_PANEL && currentScreen !== Screen.ADMIN_USERS && currentScreen !== Screen.ADMIN_VEHICLES && currentScreen !== Screen.ADMIN_REAL_ESTATE && currentScreen !== Screen.ADMIN_PARTS_SERVICES && currentScreen !== Screen.ADMIN_REPORTS && currentScreen !== Screen.ADMIN_SYSTEM_SETTINGS && currentScreen !== Screen.ADMIN_CONTENT_MODERATION && currentScreen !== Screen.ADMIN_DASHBOARD_PROMOTIONS && currentScreen !== Screen.ADMIN_REAL_ESTATE_PROMOTIONS && currentScreen !== Screen.ADMIN_PARTS_SERVICES_PROMOTIONS && currentScreen !== Screen.ADMIN_VEHICLES_PROMOTIONS;

    const unreadMessagesCount = state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

    const chatNotifications: NotificationItem[] = state.conversations
        .filter(c => c.unreadCount > 0)
        .map(c => ({
            id: `chat_${c.id}`,
            title: `Nova mensagem de ${c.senderName}`,
            message: c.lastMessage,
            time: c.time,
            unread: true,
            type: 'chat',
            image: c.avatarUrl
        }));

    const allNotifications = [...chatNotifications, ...notifications];
    const hasUnreadNotifications = allNotifications.some(n => n.unread);

    const renderScreen = () => {
        switch (currentScreen) {
            case Screen.LOGIN:
                return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} />;
            case Screen.REGISTER:
                return <RegisterScreen onBack={() => navigateTo(Screen.LOGIN)} onRegister={handleRegister} />;
            case Screen.FORGOT_PASSWORD:
                return <ForgotPassword onBack={() => navigateTo(Screen.LOGIN)} onSendResetEmail={handleForgotPassword} />;

            case Screen.DASHBOARD:
                return (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onAdClick={handleAdClick}
                        adsAtFair={fairAds}
                        featuredAds={displayFeaturedAds}
                        recentVehicles={dashboardVehicleAds}
                        trendingRealEstate={dashboardRealEstateAds}
                        serviceAds={serviceAds} // Passando a lista unificada para o Dashboard
                        fairActive={fairActive}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                        hasNotifications={hasUnreadNotifications}
                    />
                );

            case Screen.USER_PANEL:
                return <UserPanel user={user} onNavigate={navigateTo} onLogout={handleLogout} onToggleRole={handleToggleRole} />;
            case Screen.EDIT_PROFILE:
                return <EditProfile user={user} onSave={handleSaveProfile} onBack={goBackToPanel} onChangePassword={() => navigateTo(Screen.CHANGE_PASSWORD)} />;
            case Screen.MY_ADS:
                return (
                    <MyAds
                        ads={myAds}
                        onBack={() => {
                            goBackToPanel();
                            state.setMyAdsInitialTab('ativos');
                        }}
                        onDelete={handleDeleteAd}
                        onEdit={handleEditAd}
                        onCreateNew={() => prepareCreateAd()}
                        onAdClick={handleAdClick}
                        initialTab={state.myAdsInitialTab}
                    />
                );
            case Screen.CREATE_AD:
                return <CreateAd user={user} onBack={() => { (state.cameFromMyAds) ? navigateTo(Screen.MY_ADS) : goBackToDashboard(); state.setAdToEdit(undefined); state.setCameFromMyAds(false); }} onFinish={handleCreateAdFinish} editingAd={state.adToEdit} />;
            case Screen.VEHICLES_LIST:
                // Include Only Real Approved Ads
                const vehicleListAds = activeRealAds.filter(ad => ad.category === 'veiculos');
                return <VehiclesList ads={vehicleListAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} filterContext={state.filterContext} onClearFilter={() => state.setFilterContext(null)} promotions={vehiclesPromotions} onNavigate={navigateTo} />;
            case Screen.REAL_ESTATE_LIST:
                const realEstateListAds = activeRealAds.filter(ad => ad.category === 'imoveis');
                return <RealEstateList ads={realEstateListAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} filterContext={state.filterContext} onClearFilter={() => state.setFilterContext(null)} promotions={realEstatePromotions} onNavigate={navigateTo} />;
            case Screen.PARTS_SERVICES_LIST:
                return <PartsServicesList ads={serviceAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} filterContext={state.filterContext} onClearFilter={() => state.setFilterContext(null)} promotions={partsServicesPromotions} />;
            case Screen.FEATURED_VEHICLES_LIST:
                return <FeaturedVehiclesScreen ads={displayFeaturedAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;
            case Screen.FAIR_LIST:
                return <FairList ads={fairAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;

            case Screen.PUBLIC_PROFILE:
                // Show real ads of the seller, or my ads. 
                const adsToShow = viewingProfile?.id === user.id
                    ? myAds
                    : activeRealAds.filter(ad => ad.userId === viewingProfile?.id);

                return (
                    <PublicProfile
                        user={viewingProfile || MOCK_SELLER}
                        ads={adsToShow}
                        onBack={handleBackFromProfile}
                        onAdClick={handleAdClick}
                        onStartChat={handleStartChatFromAd}
                        favorites={favorites}
                        onToggleFavorite={handleToggleFavorite}
                        onReport={handleAddReport}
                    />
                );

            case Screen.VEHICLE_DETAILS:
                if (!selectedAd) {
                    return (
                        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar anúncio</h2>
                            <p className="text-gray-600 mb-4">Não foi possível carregar os detalhes deste veículo.</p>
                            <button onClick={goBackToDashboard} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">
                                Voltar ao Início
                            </button>
                        </div>
                    );
                }
                return (
                    <ErrorBoundary onReset={handleBackFromDetails}>
                        <VehicleDetails
                            ad={selectedAd}
                            onBack={handleBackFromDetails}
                            onStartChat={handleStartChatFromAd}
                            isFavorite={favorites.some(f => f.id === selectedAd.id)}
                            onToggleFavorite={() => handleToggleFavorite(selectedAd)}
                            onToggleFairPresence={() => handleToggleFairPresence(selectedAd)}
                            onViewProfile={handleViewProfile}
                            onReport={handleAddReport}
                        />
                    </ErrorBoundary>
                );
            case Screen.REAL_ESTATE_DETAILS:
                return (
                    <ErrorBoundary onReset={handleBackFromDetails}>
                        {selectedAd ? (
                            <RealEstateDetails
                                ad={selectedAd}
                                onBack={handleBackFromDetails}
                                onStartChat={handleStartChatFromAd}
                                onViewProfile={handleViewProfile}
                                onReport={handleAddReport}
                            />
                        ) : (
                            <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} dashboardPromotions={dashboardPromotions} />
                        )}
                    </ErrorBoundary>
                );
            case Screen.PART_SERVICE_DETAILS:
                return (
                    <ErrorBoundary onReset={handleBackFromDetails}>
                        {selectedAd ? (
                            <PartServiceDetails
                                ad={selectedAd}
                                onBack={handleBackFromDetails}
                                onStartChat={handleStartChatFromAd}
                                onViewProfile={handleViewProfile}
                                onReport={handleAddReport}
                            />
                        ) : (
                            <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} dashboardPromotions={dashboardPromotions} />
                        )}
                    </ErrorBoundary>
                );

            case Screen.FAVORITES:
                return <Favorites favorites={favorites} onBack={goBackToDashboard} onRemove={handleRemoveFavorite} onAdClick={handleAdClick} />;
            case Screen.HISTORY:
                return <History history={HISTORY_DATA} chartData={HISTORY_CHART_DATA} onBack={goBackToPanel} onAdClick={handleAdClick} />;
            case Screen.SETTINGS:
                return <Settings user={user} onBack={goBackToPanel} onLogout={handleLogout} onNavigate={navigateTo} />;
            case Screen.MESSAGES:
                return <Messages messages={state.conversations} onBack={goBackToDashboard} onSelectChat={handleSelectChat} />;
            case Screen.CHAT_DETAIL:
                return selectedChat ? (
                    <ChatDetail
                        chat={selectedChat}
                        messages={state.chatMessages}
                        onBack={() => navigateTo(Screen.MESSAGES)}
                        onAdClick={navigateToAdDetails}
                        onViewProfile={handleViewProfileFromChat}
                        onSendMessage={(text, imageUrl) => {
                            const adId = selectedChat.adId || (selectedAd?.id);
                            if (adId) {
                                handleSendMessage(adId, selectedChat.otherUserId, text, imageUrl);
                            }
                        }}
                    />
                ) : (
                    <Messages messages={state.conversations} onBack={goBackToDashboard} onSelectChat={handleSelectChat} />
                );
            case Screen.ACCOUNT_DATA:
                return <AccountData user={user} onBack={() => navigateTo(Screen.SETTINGS)} onEdit={() => navigateTo(Screen.EDIT_PROFILE)} />;
            case Screen.NOTIFICATIONS:
                return <Notifications onBack={goBackToDashboard} onGoToChat={() => navigateTo(Screen.MESSAGES)} items={allNotifications} />;
            case Screen.PRIVACY:
                return (
                    <Privacy
                        user={user}
                        onBack={() => navigateTo(Screen.SETTINGS)}
                        onUpdateSettings={handleUpdatePrivacySettings}
                    />
                );
            case Screen.SECURITY:
                return <Security onBack={() => navigateTo(Screen.SETTINGS)} onChangePassword={() => navigateTo(Screen.CHANGE_PASSWORD)} onDeleteAccount={handleDeleteAccount} />;
            case Screen.ABOUT_APP:
                return <AboutApp onBack={() => navigateTo(Screen.SETTINGS)} />;
            case Screen.HELP_SUPPORT:
                return <HelpSupport onBack={() => navigateTo(Screen.SETTINGS)} />;
            case Screen.ABOUT_US:
                return <AboutUs onBack={() => navigateTo(Screen.DASHBOARD)} />;
            case Screen.TERMS_OF_USE:
                return <TermsOfUse onBack={() => navigateTo(Screen.DASHBOARD)} />;
            case Screen.PRIVACY_POLICY:
                return <PrivacyPolicy onBack={() => navigateTo(Screen.DASHBOARD)} />;
            case Screen.RESET_PASSWORD:
                return <ResetPassword onBack={() => navigateTo(Screen.LOGIN)} onUpdatePassword={handleChangePassword} />;
            case Screen.CHANGE_PASSWORD:
                return (
                    <ChangePassword
                        onBack={() => navigateTo(Screen.SECURITY)}
                        onChangePassword={handleChangePassword}
                    />
                );

            // ADMIN ROUTES
            case Screen.ADMIN_PANEL:
                return user.isAdmin ? <AdminPanel onBack={() => navigateTo(Screen.SETTINGS)} onNavigate={navigateTo} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} />;
            case Screen.ADMIN_USERS:
                return user.isAdmin ? <AdminUsers onBack={() => navigateTo(Screen.ADMIN_PANEL)} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} />;
            case Screen.ADMIN_VEHICLES:
                return user.isAdmin ? <AdminVehicleAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} ads={allAdminVehicleAds} onUpdateAd={handleAdminAdUpdate} onNavigate={navigateTo} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} />;
            case Screen.ADMIN_REAL_ESTATE:
                return user.isAdmin ? <AdminRealEstateAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} ads={allAdminRealEstateAds} onUpdateAd={handleAdminAdUpdate} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} dashboardPromotions={dashboardPromotions} />;
            case Screen.ADMIN_PARTS_SERVICES:
                return user.isAdmin ? <AdminPartsServicesAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} ads={allAdminPartsServicesAds} onUpdateAd={handleAdminAdUpdate} onNavigate={navigateTo} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} />;
            case Screen.ADMIN_REPORTS:
                return user.isAdmin ? <AdminReports onBack={() => navigateTo(Screen.ADMIN_PANEL)} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} />;
            case Screen.ADMIN_SYSTEM_SETTINGS:
                return user.isAdmin ? <AdminSystemSettings onBack={() => navigateTo(Screen.ADMIN_PANEL)} fairActive={fairActive} onToggleFair={toggleFairActive} maintenanceMode={maintenanceMode} onToggleMaintenance={toggleMaintenanceModeAction} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} />;
            case Screen.ADMIN_CONTENT_MODERATION:
                return user.isAdmin ? <AdminContentModeration onBack={() => navigateTo(Screen.ADMIN_PANEL)} onBlockUser={handleModerationBlockUser} onDeleteAd={handleModerationDeleteAd} reports={reports} onUpdateReport={handleReportAction} onDeleteReport={handleDeleteReport} onViewProfile={handleViewProfile} ads={allModerationAds} onSaveAd={handleAdminSaveAd} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} />;
            case Screen.ADMIN_DASHBOARD_PROMOTIONS:
                return user.isAdmin ? (
                    <AdminDashboardPromotions
                        onBack={() => navigateTo(Screen.ADMIN_PANEL)}
                        promotions={dashboardPromotions}
                        onSave={handleSavePromotion}
                        onDelete={handleDeletePromotion}
                        onToggleActive={handleTogglePromotionActive}
                    />
                ) : (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                    />
                );
            case Screen.ADMIN_PARTS_SERVICES_PROMOTIONS:
                return user.isAdmin ? (
                    <AdminPartsServicesPromotions
                        onBack={() => navigateTo(Screen.ADMIN_PANEL)}
                        promotions={partsServicesPromotions}
                        onSave={handleSavePartsServicesPromotion}
                        onDelete={handleDeletePartsServicesPromotion}
                        onToggleActive={handleTogglePartsServicesPromotionActive}
                    />
                ) : (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                    />
                );
            case Screen.ADMIN_VEHICLES_PROMOTIONS:
                return user.isAdmin ? (
                    <AdminVehiclesPromotions
                        onBack={() => navigateTo(Screen.ADMIN_PANEL)}
                        promotions={vehiclesPromotions}
                        onSave={handleSaveVehiclesPromotion}
                        onDelete={handleDeleteVehiclesPromotion}
                        onToggleActive={handleToggleVehiclesPromotionActive}
                    />
                ) : (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                    />
                );
            case Screen.ADMIN_REAL_ESTATE_PROMOTIONS:
                return user.isAdmin ? (
                    <AdminRealEstatePromotions
                        onBack={() => navigateTo(Screen.ADMIN_PANEL)}
                        promotions={realEstatePromotions}
                        onSave={handleSaveRealEstatePromotion}
                        onDelete={handleDeleteRealEstatePromotion}
                        onToggleActive={handleToggleRealEstatePromotionActive}
                    />
                ) : (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                    />
                );

            default:
                return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen text-slate-800 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100">
            {state.toast && (
                <Toast
                    message={state.toast.message}
                    type={state.toast.type}
                    onClose={() => state.setToast(null)}
                />
            )}

            {renderScreen()}

            {showBottomNav && (
                <BottomNav
                    currentScreen={currentScreen}
                    onNavigate={navigateTo}
                    unreadCount={unreadMessagesCount}
                />
            )}
        </div>
    );
};
