import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { Screen, AdItem } from '../../types';
import { AppState } from '../../types/AppState';
import { AppActions } from '../../types/AppActions';
import {
    APP_LOGOS
} from '../../constants';

// Screens
import { LoginScreen } from '../../screens/LoginScreen';
import { RegisterScreen } from '../../screens/RegisterScreen';
import { AcceptTermsScreen } from '../../screens/AcceptTermsScreen';
import { ForgotPassword } from '../../screens/ForgotPassword';
import { Dashboard } from '../../screens/Dashboard';
import { UserPanel } from '../../screens/UserPanel';
import { MyAds } from '../../screens/MyAds';
import { Favorites } from '../../screens/Favorites';
import { Settings } from '../../screens/Settings';
import { Messages } from '../../screens/Messages';
import { EditProfile } from '../../screens/EditProfile';
import { ChangePassword } from '../../screens/ChangePassword';
import { ResetPassword } from '../../screens/ResetPassword';
import { CreateAd } from '../../screens/CreateAd';
import { VehicleDetails } from '../../screens/VehicleDetails';
import { RealEstateDetails } from '../../screens/RealEstateDetails';
import { PartServiceDetails } from '../../screens/PartServiceDetails';
import { AccountData } from '../../screens/AccountData';
import { Notifications } from '../../screens/Notifications';
import { Privacy } from '../../screens/Privacy';
import { Security } from '../../screens/Security';
import { BlockedUsersScreen } from '../../screens/BlockedUsersScreen';
import { AboutApp } from '../../screens/AboutApp';
import { HelpSupport } from '../../screens/HelpSupport';
import { AboutUs } from '../../screens/AboutUs';
import { TermsOfUse } from '../../screens/TermsOfUse';
import { PrivacyPolicy } from '../../screens/PrivacyPolicy';
import { ChatDetail } from '../../screens/ChatDetail';
import { VehiclesList } from '../../screens/VehiclesList';
import { RealEstateList } from '../../screens/RealEstateList';
import { PartsServicesList } from '../../screens/PartsServicesList';
import { FeaturedVehiclesScreen } from '../../screens/FeaturedVehiclesScreen';
import { FairList } from '../../screens/FairList';
import { PrintPreview } from '../../screens/PrintPreview';
import { PublicProfile } from '../../screens/PublicProfile';
import { AdminPanel } from '../../screens/AdminPanel';
import { AdminUsers } from '../../screens/AdminUsers';
import { AdminVehicleAds } from '../../screens/AdminVehicleAds';
import { AdminRealEstateAds } from '../../screens/AdminRealEstateAds';
import { AdminPartsServicesAds } from '../../screens/AdminPartsServicesAds';
import { BoostTurboScreen } from '../../screens/BoostTurboScreen';
import { AdminSystemSettings } from '../../screens/AdminSystemSettings';
import { AdminContentModeration } from '../../screens/AdminContentModeration';
import { AdminDashboardPromotions } from '../../screens/AdminDashboardPromotions';
import { AdminRealEstatePromotions } from '../../screens/AdminRealEstatePromotions';
import { AdminPartsServicesPromotions } from '../../screens/AdminPartsServicesPromotions';
import { AdminVehiclesPromotions } from '../../screens/AdminVehiclesPromotions';
import { ErrorBoundary } from '../ErrorBoundary';

export interface RouterContextProps {
    state: AppState;
    actions: AppActions;
    computed: {
        fairAds?: AdItem[];
        displayFeaturedAds?: AdItem[];
        dashboardVehicleAds?: AdItem[];
        dashboardRealEstateAds?: AdItem[];
        serviceAds?: AdItem[];
        hasUnreadNotifications: boolean;
        allAdminVehicleAds: AdItem[];
        allAdminRealEstateAds: AdItem[];
        allModerationAds: AdItem[];
        allAdminPartsServicesAds: AdItem[];
        allNotifications: any[];
    };
    handlers: {
        handleBackFromDetails: () => void;
        handleBackFromProfile: () => void;
    };
}

export const renderScreen = (currentScreen: Screen, ctx: RouterContextProps) => {
    const { state, actions, computed, handlers } = ctx;
    const {
        user, myAds, fairActive, selectedAd, selectedChat,
        viewingProfile, reports,
        dashboardPromotions, realEstatePromotions, partsServicesPromotions, vehiclesPromotions,
        activeRealAds, adminAds, favorites, maintenanceMode, previousScreen
    } = state;

    const {
        handleLogin, handleLogout, handleRegister, navigateTo, handleAdClick,
        goBackToDashboard, goBackToPanel, handleSaveProfile,
        handleToggleRole, handleDeleteAd, handleEditAd,
        handleCreateAdFinish, handleToggleFavorite,
        handleStartChatFromAd, handleAddReport, handleToggleFairPresence,
        handleViewProfile, handleRemoveFavorite, handleSelectChat,
        navigateToAdDetails, handleViewProfileFromChat, handleDeleteAccount,
        handleAdminAdUpdate, handleModerationBlockUser, handleModerationDeleteAd,
        handleReportAction, handleDeleteReport, handleAdminSaveAd,
        handleSavePromotion, handleDeletePromotion, handleTogglePromotionActive,
        handleSaveRealEstatePromotion, handleDeleteRealEstatePromotion, handleToggleRealEstatePromotionActive,
        handleSavePartsServicesPromotion, handleDeletePartsServicesPromotion, handleTogglePartsServicesPromotionActive,
        handleSaveVehiclesPromotion, handleDeleteVehiclesPromotion, handleToggleVehiclesPromotionActive,
        toggleFairActive, toggleMaintenanceMode: toggleMaintenanceModeAction, prepareCreateAd,
        openNewArrivals, openAutomotiveServices, openTrendingRealEstate,
        handleSendMessage, handleUpdatePrivacySettings, handleChangePassword,
        handleForgotPassword, handleClearNotifications
    } = actions;

    const {
        fairAds, displayFeaturedAds, dashboardVehicleAds, dashboardRealEstateAds,
        serviceAds, hasUnreadNotifications, allAdminVehicleAds, allAdminRealEstateAds,
        allModerationAds, allAdminPartsServicesAds, allNotifications
    } = computed;

    const { handleBackFromDetails, handleBackFromProfile } = handlers;

    switch (currentScreen) {
        case Screen.LOGIN:
            return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
        case Screen.REGISTER:
            return <RegisterScreen onBack={() => navigateTo(Screen.LOGIN)} onRegister={handleRegister} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
        case Screen.FORGOT_PASSWORD:
            return <ForgotPassword onBack={() => navigateTo(Screen.LOGIN)} onSendResetEmail={handleForgotPassword} />;
        case Screen.ACCEPT_TERMS:
            return <AcceptTermsScreen onAccept={actions.handleAcceptTerms} onLogout={handleLogout} />;

        case Screen.DASHBOARD:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
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
                    serviceAds={serviceAds}
                    fairActive={fairActive}
                    onOpenNewArrivals={openNewArrivals}
                    onOpenServices={openAutomotiveServices}
                    onOpenTrending={openTrendingRealEstate}
                    dashboardPromotions={dashboardPromotions}
                    hasNotifications={hasUnreadNotifications}
                />
            );

        case Screen.USER_PANEL:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
            return <UserPanel user={user} onNavigate={navigateTo} onLogout={handleLogout} onToggleRole={handleToggleRole} />;
        case Screen.EDIT_PROFILE:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
            return <EditProfile user={user} onSave={handleSaveProfile} onBack={goBackToPanel} onChangePassword={() => navigateTo(Screen.CHANGE_PASSWORD)} />;
        case Screen.MY_ADS:
            return (
                <MyAds
                    ads={myAds}
                    onBack={() => {
                        goBackToPanel();
                        if (state.setMyAdsInitialTab) state.setMyAdsInitialTab('ativos');
                    }}
                    onDelete={handleDeleteAd}
                    onEdit={handleEditAd}
                    onBoostAd={(ad) => {
                        if (state.setAdToEdit) state.setAdToEdit(ad);
                        navigateTo(Screen.BOOST_TURBO);
                    }}
                    onShowToast={state.setToast}
                    onCreateNew={() => prepareCreateAd()}
                    onAdClick={handleAdClick}
                    initialTab={state.myAdsInitialTab}
                />
            );
        case Screen.BOOST_TURBO:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
            return <BoostTurboScreen adId={state.adToEdit?.id || null} onBack={() => { if (state.setAdToEdit) state.setAdToEdit(undefined); navigateTo(Screen.MY_ADS); }} />;
        case Screen.CREATE_AD:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
            return <CreateAd user={user} onBack={() => { (state.cameFromMyAds) ? navigateTo(Screen.MY_ADS) : goBackToDashboard(); if (state.setAdToEdit) state.setAdToEdit(undefined); if (state.setCameFromMyAds) state.setCameFromMyAds(false); }} onFinish={handleCreateAdFinish} editingAd={state.adToEdit} />;
        case Screen.VEHICLES_LIST:
            const vehicleListAds = activeRealAds.filter(ad => ad.category === 'veiculos');
            return <VehiclesList ads={vehicleListAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} filterContext={state.filterContext} onClearFilter={() => { if (state.setFilterContext) state.setFilterContext(null) }} promotions={vehiclesPromotions} onNavigate={navigateTo} user={user} currentScreen={currentScreen} />;
        case Screen.REAL_ESTATE_LIST:
            const realEstateListAds = activeRealAds.filter(ad => ad.category === 'imoveis');
            return <RealEstateList ads={realEstateListAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} filterContext={state.filterContext} onClearFilter={() => { if (state.setFilterContext) state.setFilterContext(null) }} promotions={realEstatePromotions} onNavigate={navigateTo} user={user} currentScreen={currentScreen} />;
        case Screen.PARTS_SERVICES_LIST:
            return <PartsServicesList ads={serviceAds || []} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} filterContext={state.filterContext} onClearFilter={() => { if (state.setFilterContext) state.setFilterContext(null) }} promotions={partsServicesPromotions} user={user} currentScreen={currentScreen} />;
        case Screen.FEATURED_VEHICLES_LIST:
            return <FeaturedVehiclesScreen ads={displayFeaturedAds || []} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;
        case Screen.FAIR_LIST:
            return <FairList ads={fairAds || []} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;

        case Screen.PUBLIC_PROFILE:
            if (!viewingProfile) {
                return (
                    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 text-center animate-in fade-in duration-300">
                        <UserIcon className="w-16 h-16 text-gray-200 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Perfil não disponível</h2>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Não foi possível carregar as informações deste anunciante no momento. Por favor, tente novamente mais tarde.
                        </p>
                        <button 
                            onClick={handleBackFromProfile} 
                            className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                        >
                            Voltar
                        </button>
                    </div>
                );
            }

            const adsToShow = viewingProfile?.id === user?.id
                ? myAds
                : activeRealAds.filter(ad => ad.userId === viewingProfile?.id);

            return (
                <PublicProfile
                    user={viewingProfile}
                    ads={adsToShow}
                    onBack={handleBackFromProfile}
                    onAdClick={handleAdClick}
                    onStartChat={handleStartChatFromAd}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onReport={handleAddReport}
                    onBlockUser={actions.handleBlockUser}
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
                        onBlockUser={actions.handleBlockUser}
                        onPrint={() => navigateTo(Screen.PRINT_PREVIEW)}
                        user={user}
                    />
                </ErrorBoundary>
            );
        case Screen.PRINT_PREVIEW:
            if (!selectedAd) return <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} dashboardPromotions={dashboardPromotions} />;
            return (
                <PrintPreview
                    ad={selectedAd}
                    onBack={handleBackFromDetails}
                />
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
                            onBlockUser={actions.handleBlockUser}
                            onPrint={() => navigateTo(Screen.PRINT_PREVIEW)}
                            user={user}
                        />
                    ) : (
                        user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />
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
                            onBlockUser={actions.handleBlockUser}
                            onPrint={() => navigateTo(Screen.PRINT_PREVIEW)}
                            user={user}
                        />
                    ) : (
                        user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />
                    )}
                </ErrorBoundary>
            );

        case Screen.FAVORITES:
            return <Favorites favorites={favorites} onBack={goBackToDashboard} onRemove={handleRemoveFavorite} onAdClick={handleAdClick} />;
        case Screen.SETTINGS:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
            return <Settings user={user} onBack={goBackToPanel} onLogout={handleLogout} onNavigate={navigateTo} />;
        case Screen.MESSAGES:
            return <Messages messages={state.conversations || []} onBack={goBackToDashboard} onSelectChat={handleSelectChat} />;
        case Screen.CHAT_DETAIL:
            return selectedChat ? (
                <ChatDetail
                    chat={selectedChat}
                    messages={state.chatMessages || []}
                    onBack={handleBackFromDetails}
                    onAdClick={navigateToAdDetails}
                    onViewProfile={handleViewProfileFromChat}
                    onSendMessage={(text, images) => {
                        const adId = selectedChat.adId || (selectedAd?.id);
                        if (adId) {
                            handleSendMessage(adId, selectedChat.otherUserId, text, images);
                        }
                    }}
                    onBlockUser={actions.handleBlockUser}
                    isBlocked={user ? state.isBlockedBetween(user.id, selectedChat.otherUserId) : false}
                />
            ) : (
                <Messages messages={state.conversations || []} onBack={goBackToDashboard} onSelectChat={handleSelectChat} />
            );
        case Screen.ACCOUNT_DATA:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
            return <AccountData user={user} onBack={() => navigateTo(Screen.SETTINGS)} onEdit={() => navigateTo(Screen.EDIT_PROFILE)} />;
        case Screen.NOTIFICATIONS:
            return <Notifications onBack={handleBackFromDetails} onGoToChat={() => navigateTo(Screen.MESSAGES)} onClearAll={handleClearNotifications} items={allNotifications} />;
        case Screen.PRIVACY:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
            return <Privacy user={user} onBack={() => navigateTo(Screen.SETTINGS)} onUpdateSettings={handleUpdatePrivacySettings} onNavigate={navigateTo} />;
        case Screen.BLOCKED_USERS:
            if (!user) return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
            return <BlockedUsersScreen onBack={() => navigateTo(Screen.PRIVACY)} onUnblock={actions.handleUnblockUser} />;
        case Screen.SECURITY:
            return <Security onBack={() => navigateTo(Screen.SETTINGS)} onChangePassword={() => navigateTo(Screen.CHANGE_PASSWORD)} onDeleteAccount={handleDeleteAccount} />;
        case Screen.ABOUT_APP:
            return <AboutApp onBack={() => navigateTo(Screen.SETTINGS)} />;
        case Screen.HELP_SUPPORT:
            return <HelpSupport onBack={() => navigateTo(Screen.SETTINGS)} />;
        case Screen.ABOUT_US:
            return <AboutUs onBack={() => navigateTo(Screen.DASHBOARD)} />;
        case Screen.TERMS_OF_USE: {
            const safeBack = () => {
                if (previousScreen === Screen.REGISTER) {
                    navigateTo(Screen.REGISTER);
                } else {
                    navigateTo(Screen.LOGIN);
                }
            };
            return <TermsOfUse onBack={safeBack} />;
        }
        case Screen.PRIVACY_POLICY: {
            const safeBack = () => {
                if (previousScreen === Screen.REGISTER) {
                    navigateTo(Screen.REGISTER);
                } else {
                    navigateTo(Screen.LOGIN);
                }
            };
            return <PrivacyPolicy onBack={safeBack} />;
        }
        case Screen.RESET_PASSWORD:
            return <ResetPassword onBack={() => navigateTo(Screen.LOGIN)} onUpdatePassword={handleChangePassword} />;
        case Screen.CHANGE_PASSWORD:
            return <ChangePassword onBack={() => navigateTo(Screen.SECURITY)} onChangePassword={handleChangePassword} />;

        // ADMIN ROUTES
        case Screen.ADMIN_PANEL:
            return (user && user.isAdmin) ? <AdminPanel onBack={() => navigateTo(Screen.SETTINGS)} onNavigate={navigateTo} /> : (user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />);
        case Screen.ADMIN_USERS:
            return (user && user.isAdmin) ? <AdminUsers onBack={() => navigateTo(Screen.ADMIN_PANEL)} /> : (user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />);
        case Screen.ADMIN_VEHICLES:
            return (user && user.isAdmin) ? <AdminVehicleAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} ads={allAdminVehicleAds} onUpdateAd={handleAdminAdUpdate} onNavigate={navigateTo} /> : (user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />);
        case Screen.ADMIN_REAL_ESTATE:
            return (user && user.isAdmin) ? <AdminRealEstateAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} ads={allAdminRealEstateAds} onUpdateAd={handleAdminAdUpdate} /> : (user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />);
        case Screen.ADMIN_PARTS_SERVICES:
            return (user && user.isAdmin) ? <AdminPartsServicesAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} ads={allAdminPartsServicesAds} onUpdateAd={handleAdminAdUpdate} onNavigate={navigateTo} /> : (user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />);
        case Screen.ADMIN_SYSTEM_SETTINGS:
            return (user && user.isAdmin) ? <AdminSystemSettings onBack={() => navigateTo(Screen.ADMIN_PANEL)} fairActive={fairActive} onToggleFair={toggleFairActive} maintenanceMode={maintenanceMode} onToggleMaintenance={toggleMaintenanceModeAction} /> : (user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />);
        case Screen.ADMIN_CONTENT_MODERATION:
            return (user && user.isAdmin) ? <AdminContentModeration onBack={() => navigateTo(Screen.ADMIN_PANEL)} onBlockUser={handleModerationBlockUser} onDeleteAd={handleModerationDeleteAd} reports={reports} onUpdateReport={handleReportAction} onDeleteReport={handleDeleteReport} onViewProfile={handleViewProfile} ads={allModerationAds} onSaveAd={handleAdminSaveAd} /> : (user ? <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} onOpenNewArrivals={openNewArrivals} onOpenServices={openAutomotiveServices} onOpenTrending={openTrendingRealEstate} dashboardPromotions={dashboardPromotions} /> : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />);
        case Screen.ADMIN_DASHBOARD_PROMOTIONS:
            return (user && user.isAdmin) ? (
                <AdminDashboardPromotions
                    onBack={() => navigateTo(Screen.ADMIN_PANEL)}
                    promotions={dashboardPromotions || []}
                    onSave={handleSavePromotion}
                    onDelete={handleDeletePromotion}
                    onToggleActive={handleTogglePromotionActive}
                />
            ) : (
                user ? (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                    />
                ) : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />
            );
        case Screen.ADMIN_PARTS_SERVICES_PROMOTIONS:
            return (user && user.isAdmin) ? (
                <AdminPartsServicesPromotions
                    onBack={() => navigateTo(Screen.ADMIN_PANEL)}
                    promotions={partsServicesPromotions || []}
                    onSave={handleSavePartsServicesPromotion}
                    onDelete={handleDeletePartsServicesPromotion}
                    onToggleActive={handleTogglePartsServicesPromotionActive}
                />
            ) : (
                user ? (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                    />
                ) : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />
            );
        case Screen.ADMIN_VEHICLES_PROMOTIONS:
            return (user && user.isAdmin) ? (
                <AdminVehiclesPromotions
                    onBack={() => navigateTo(Screen.ADMIN_PANEL)}
                    promotions={vehiclesPromotions || []}
                    onSave={handleSaveVehiclesPromotion}
                    onDelete={handleDeleteVehiclesPromotion}
                    onToggleActive={handleToggleVehiclesPromotionActive}
                />
            ) : (
                user ? (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                    />
                ) : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />
            );
        case Screen.ADMIN_REAL_ESTATE_PROMOTIONS:
            return (user && user.isAdmin) ? (
                <AdminRealEstatePromotions
                    onBack={() => navigateTo(Screen.ADMIN_PANEL)}
                    promotions={realEstatePromotions || []}
                    onSave={handleSaveRealEstatePromotion}
                    onDelete={handleDeleteRealEstatePromotion}
                    onToggleActive={handleToggleRealEstatePromotionActive}
                />
            ) : (
                user ? (
                    <Dashboard
                        user={user}
                        onNavigate={navigateTo}
                        onLogout={handleLogout}
                        onOpenNewArrivals={openNewArrivals}
                        onOpenServices={openAutomotiveServices}
                        onOpenTrending={openTrendingRealEstate}
                        dashboardPromotions={dashboardPromotions}
                    />
                ) : <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />
            );

        default:
            return <LoginScreen onLogin={handleLogin} onForgotPassword={() => navigateTo(Screen.FORGOT_PASSWORD)} onRegister={() => navigateTo(Screen.REGISTER)} onViewTerms={() => navigateTo(Screen.TERMS_OF_USE)} onViewPrivacy={() => navigateTo(Screen.PRIVACY_POLICY)} />;
    }
};
