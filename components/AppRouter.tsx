
import React from 'react';
import { Screen, User, AdItem, AdStatus, MessageItem, BannerItem, NotificationItem, ReportItem } from '../types';
import {
    HISTORY_DATA,
    HISTORY_CHART_DATA,
    MESSAGES_DATA,
    POPULAR_CARS
} from '../constants';
import { MOCK_SELLER } from '../src/constants';

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
import { AdminBanners } from '../screens/AdminBanners';
import { AdminSystemSettings } from '../screens/AdminSystemSettings';
import { AdminContentModeration } from '../screens/AdminContentModeration';

interface AppRouterProps {
    currentScreen: Screen;
    user: User;
    onLogin: (user: User) => void;
    onForgotPassword: () => void;
    onRegister: () => void;
    onBackToLogin: () => void;
    handleRegister: (data: Partial<User>) => void;
    navigateTo: (screen: Screen) => void;
    handleLogout: () => void;
    handleAdClick: (ad: AdItem) => void;
    fairAds: AdItem[];
    banners: BannerItem[];
    displayFeaturedAds: AdItem[];
    dashboardVehicleAds: AdItem[];
    fairActive: boolean;
    handleToggleRole: () => void;
    handleSaveProfile: (user: User) => void;
    goBackToPanel: () => void;
    myAds: AdItem[];
    handleDeleteAd: (id: string) => void;
    handleEditAd: (ad: AdItem) => void;
    setAdToEdit: (ad: AdItem | undefined) => void;
    goBackToDashboard: () => void;
    handleCreateAdFinish: (data: Partial<AdItem>) => void;
    adToEdit: AdItem | undefined;
    allAds: AdItem[];
    vehicleBanners: BannerItem[];
    favorites: AdItem[];
    handleToggleFavorite: (ad: AdItem) => void;
    realEstateBanners: BannerItem[];
    partsServicesBanners: BannerItem[];
    viewingProfile: User | null;
    previousScreen: Screen;
    setCurrentScreen: (screen: Screen) => void;
    selectedAd: AdItem | null;
    setPreviousScreen: (screen: Screen) => void;
    handleStartChatFromAd: () => void;
    handleAddReport: (report: ReportItem) => void;
    handleToggleFairPresence: (ad: AdItem) => void;
    handleViewProfile: () => void;
    handleRemoveFavorite: (id: string) => void;
    handleSelectChat: (chat: MessageItem) => void;
    selectedChat: MessageItem | null;
    navigateToAdDetails: () => void;
    handleViewProfileFromChat: () => void;
    notifications: NotificationItem[];
    handleDeleteAccount: () => void;
    allAdminVehicleAds: AdItem[];
    handleAdminAdUpdate: (id: string, status: AdStatus) => void;
    setBanners: (banners: BannerItem[]) => void;
    setVehicleBanners: (banners: BannerItem[]) => void;
    realEstateBannersState: BannerItem[];
    setRealEstateBanners: (banners: BannerItem[]) => void;
    partsServicesBannersState: BannerItem[];
    setPartsServicesBanners: (banners: BannerItem[]) => void;
    onToggleFair: (active: boolean) => void;
    maintenanceMode: boolean;
    onToggleMaintenance: (active: boolean) => void;
    handleModerationBlockUser: (id: string, name: string) => void;
    handleModerationDeleteAd: (id: string, title: string) => void;
    reports: ReportItem[];
    handleReportAction: (id: string, action: 'resolved' | 'dismissed') => void;
    allModerationAds: AdItem[];
    handleAdminSaveAd: (ad: AdItem) => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
    currentScreen,
    user,
    onLogin,
    onForgotPassword,
    onRegister,
    onBackToLogin,
    handleRegister,
    navigateTo,
    handleLogout,
    handleAdClick,
    fairAds,
    banners,
    displayFeaturedAds,
    dashboardVehicleAds,
    fairActive,
    handleToggleRole,
    handleSaveProfile,
    goBackToPanel,
    myAds,
    handleDeleteAd,
    handleEditAd,
    setAdToEdit,
    goBackToDashboard,
    handleCreateAdFinish,
    adToEdit,
    allAds,
    vehicleBanners,
    favorites,
    handleToggleFavorite,
    realEstateBanners,
    partsServicesBanners,
    viewingProfile,
    previousScreen,
    setCurrentScreen,
    selectedAd,
    setPreviousScreen,
    handleStartChatFromAd,
    handleAddReport,
    handleToggleFairPresence,
    handleViewProfile,
    handleRemoveFavorite,
    handleSelectChat,
    selectedChat,
    navigateToAdDetails,
    handleViewProfileFromChat,
    notifications,
    handleDeleteAccount,
    allAdminVehicleAds,
    handleAdminAdUpdate,
    setBanners,
    setVehicleBanners,
    realEstateBannersState,
    setRealEstateBanners,
    partsServicesBannersState,
    setPartsServicesBanners,
    onToggleFair,
    maintenanceMode,
    onToggleMaintenance,
    handleModerationBlockUser,
    handleModerationDeleteAd,
    reports,
    handleReportAction,
    allModerationAds,
    handleAdminSaveAd
}) => {
    switch (currentScreen) {
        case Screen.LOGIN:
            return <LoginScreen onLogin={onLogin} onForgotPassword={onForgotPassword} onRegister={onRegister} />;
        case Screen.REGISTER:
            return <RegisterScreen onBack={onBackToLogin} onRegister={handleRegister} />;
        case Screen.FORGOT_PASSWORD:
            return <ForgotPassword onBack={onBackToLogin} />;

        case Screen.DASHBOARD:
            return (
                <Dashboard
                    user={user}
                    onNavigate={navigateTo}
                    onLogout={handleLogout}
                    onAdClick={handleAdClick}
                    adsAtFair={fairAds}
                    banners={banners}
                    featuredAds={displayFeaturedAds}
                    recentVehicles={dashboardVehicleAds}
                    fairActive={fairActive}
                />
            );

        case Screen.USER_PANEL:
            return <UserPanel user={user} onNavigate={navigateTo} onLogout={handleLogout} onToggleRole={handleToggleRole} />;
        case Screen.EDIT_PROFILE:
            return <EditProfile user={user} onSave={handleSaveProfile} onBack={goBackToPanel} onChangePassword={() => navigateTo(Screen.CHANGE_PASSWORD)} />;
        case Screen.CHANGE_PASSWORD:
            return <ChangePassword onBack={() => navigateTo(Screen.SECURITY)} />;
        case Screen.MY_ADS:
            return <MyAds ads={myAds} onBack={goBackToPanel} onDelete={handleDeleteAd} onEdit={handleEditAd} onCreateNew={() => { setAdToEdit(undefined); navigateTo(Screen.CREATE_AD); }} onAdClick={handleAdClick} />;
        case Screen.CREATE_AD:
            return <CreateAd user={user} onBack={() => { setAdToEdit(undefined); goBackToDashboard(); }} onFinish={handleCreateAdFinish} editingAd={adToEdit} />;
        case Screen.VEHICLES_LIST:
            return <VehiclesList ads={allAds} banners={vehicleBanners} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;
        case Screen.REAL_ESTATE_LIST:
            return <RealEstateList ads={allAds} banners={realEstateBanners} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;
        case Screen.PARTS_SERVICES_LIST:
            return <PartsServicesList ads={allAds} banners={partsServicesBanners} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;
        case Screen.FEATURED_VEHICLES_LIST:
            return <FeaturedVehiclesScreen ads={displayFeaturedAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;
        case Screen.FAIR_LIST:
            return <FairList ads={fairAds} onBack={goBackToDashboard} onAdClick={handleAdClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />;

        case Screen.PUBLIC_PROFILE:
            const adsToShow = viewingProfile?.email === user.email ? myAds : POPULAR_CARS;
            return (
                <PublicProfile
                    user={viewingProfile || MOCK_SELLER}
                    ads={adsToShow}
                    onBack={() => {
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
                    }}
                    onAdClick={handleAdClick}
                    onStartChat={handleStartChatFromAd}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onReport={handleAddReport}
                />
            );

        case Screen.VEHICLE_DETAILS:
            return selectedAd ? <VehicleDetails ad={selectedAd} onBack={() => setCurrentScreen(previousScreen)} onStartChat={handleStartChatFromAd} isFavorite={favorites.some(f => f.id === selectedAd.id)} onToggleFavorite={() => handleToggleFavorite(selectedAd)} onToggleFairPresence={() => handleToggleFairPresence(selectedAd)} onViewProfile={handleViewProfile} onReport={handleAddReport} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} />;
        case Screen.REAL_ESTATE_DETAILS:
            return selectedAd ? <RealEstateDetails ad={selectedAd} onBack={() => setCurrentScreen(previousScreen)} onStartChat={handleStartChatFromAd} onViewProfile={handleViewProfile} onReport={handleAddReport} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} />;
        case Screen.PART_SERVICE_DETAILS:
            return selectedAd ? <PartServiceDetails ad={selectedAd} onBack={() => setCurrentScreen(previousScreen)} onStartChat={handleStartChatFromAd} onViewProfile={handleViewProfile} onReport={handleAddReport} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} adsAtFair={fairAds} featuredAds={displayFeaturedAds} fairActive={fairActive} />;

        case Screen.FAVORITES:
            return <Favorites favorites={favorites} onBack={goBackToDashboard} onRemove={handleRemoveFavorite} onAdClick={handleAdClick} />;
        case Screen.HISTORY:
            return <History history={HISTORY_DATA} chartData={HISTORY_CHART_DATA} onBack={goBackToPanel} onAdClick={handleAdClick} />;
        case Screen.SETTINGS:
            return <Settings user={user} onBack={goBackToPanel} onLogout={handleLogout} onNavigate={navigateTo} />;
        case Screen.MESSAGES:
            return <Messages messages={MESSAGES_DATA} onBack={goBackToDashboard} onSelectChat={handleSelectChat} />;
        case Screen.CHAT_DETAIL:
            return selectedChat ? (
                <ChatDetail
                    chat={selectedChat}
                    onBack={() => setCurrentScreen(Screen.MESSAGES)}
                    onAdClick={navigateToAdDetails}
                    onViewProfile={handleViewProfileFromChat}
                />
            ) : (
                <Messages messages={MESSAGES_DATA} onBack={goBackToDashboard} onSelectChat={handleSelectChat} />
            );
        case Screen.ACCOUNT_DATA:
            return <AccountData user={user} onBack={() => navigateTo(Screen.SETTINGS)} onEdit={() => navigateTo(Screen.EDIT_PROFILE)} />;
        case Screen.NOTIFICATIONS:
            return <Notifications onBack={goBackToDashboard} onGoToChat={() => navigateTo(Screen.MESSAGES)} items={notifications} />;
        case Screen.PRIVACY:
            return <Privacy onBack={() => navigateTo(Screen.SETTINGS)} />;
        case Screen.SECURITY:
            return <Security onBack={() => navigateTo(Screen.SETTINGS)} onChangePassword={() => navigateTo(Screen.CHANGE_PASSWORD)} onDeleteAccount={handleDeleteAccount} />;
        case Screen.ABOUT_APP:
            return <AboutApp onBack={() => navigateTo(Screen.SETTINGS)} />;
        case Screen.HELP_SUPPORT:
            return <HelpSupport onBack={() => navigateTo(Screen.SETTINGS)} />;

        // ADMIN ROUTES
        case Screen.ADMIN_PANEL:
            return user.isAdmin ? <AdminPanel onBack={() => navigateTo(Screen.SETTINGS)} onNavigate={navigateTo} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
        case Screen.ADMIN_USERS:
            return user.isAdmin ? <AdminUsers onBack={() => navigateTo(Screen.ADMIN_PANEL)} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
        case Screen.ADMIN_VEHICLES:
            return user.isAdmin ? <AdminVehicleAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} ads={allAdminVehicleAds} onUpdateAd={handleAdminAdUpdate} onNavigate={navigateTo} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
        case Screen.ADMIN_REAL_ESTATE:
            return user.isAdmin ? <AdminRealEstateAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
        case Screen.ADMIN_PARTS_SERVICES:
            return user.isAdmin ? <AdminPartsServicesAds onBack={() => navigateTo(Screen.ADMIN_PANEL)} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
        case Screen.ADMIN_REPORTS:
            return user.isAdmin ? <AdminReports onBack={() => navigateTo(Screen.ADMIN_PANEL)} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
        case Screen.ADMIN_BANNERS:
            return user.isAdmin ? <AdminBanners onBack={() => navigateTo(Screen.ADMIN_PANEL)} banners={banners} setBanners={setBanners} vehicleBanners={vehicleBanners} setVehicleBanners={setVehicleBanners} realEstateBanners={realEstateBannersState} setRealEstateBanners={setRealEstateBanners} partsServicesBanners={partsServicesBannersState} setPartsServicesBanners={setPartsServicesBanners} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
        case Screen.ADMIN_SYSTEM_SETTINGS:
            return user.isAdmin ? <AdminSystemSettings onBack={() => navigateTo(Screen.ADMIN_PANEL)} fairActive={fairActive} onToggleFair={onToggleFair} maintenanceMode={maintenanceMode} onToggleMaintenance={onToggleMaintenance} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
        case Screen.ADMIN_CONTENT_MODERATION:
            return user.isAdmin ? <AdminContentModeration onBack={() => navigateTo(Screen.ADMIN_PANEL)} onBlockUser={handleModerationBlockUser} onDeleteAd={handleModerationDeleteAd} reports={reports} onUpdateReport={handleReportAction} ads={allModerationAds} onSaveAd={handleAdminSaveAd} /> : <Dashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;

        default:
            return <LoginScreen onLogin={onLogin} onForgotPassword={onForgotPassword} onRegister={onRegister} />;
    }
};
