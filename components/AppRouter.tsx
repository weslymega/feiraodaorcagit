
import React from 'react';
import { Screen, AdItem, AdStatus, NotificationItem } from '../types';
import {
    APP_LOGOS
} from '../constants';

import { AppState } from '../types/AppState';
import { AppActions } from '../types/AppActions';

// Router mapping
import { renderScreen, RouterContextProps } from './router/screenMap';

import { Wrench, Shield } from 'lucide-react';
import { BottomNav, Toast } from '../components/Shared';
import { AppLoadingOverlay } from './AppLoadingOverlay';
import { ErrorBoundary } from './ErrorBoundary';
import { PaymentStatusFeedback } from './PaymentStatusFeedback';
import ScrollToTop from './ScrollToTop';

interface AppRouterProps {
    state: AppState;
    actions: AppActions;
}

export const AppRouter: React.FC<AppRouterProps> = ({ state, actions }) => {
    const {
        currentScreen, setCurrentScreen, user, maintenanceMode, myAds, adminMockAds,
        fairActive, selectedAd, previousScreen, selectedChat,
        viewingProfile, notifications, reports,
        dashboardPromotions, realEstatePromotions, partsServicesPromotions, vehiclesPromotions,
        isAppReady, authInitialized, authLoading
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

    // Helper to trigger Skeletons: return undefined if !isAppReady, otherwise the filtered list
    const getListOrUndefined = (source: AdItem[], filterFn: (ad: AdItem) => boolean) => {
        if (!isAppReady) return undefined;
        return source.filter(filterFn);
    };

    // 1. Meus Anúncios Ativos (já filtrados no hook ou aqui)
    const activeMyAds = myAds.filter(ad => ad.status === AdStatus.ACTIVE);

    // 2. Todos os Anúncios Ativos Globais (Vindo do Supabase)
    const allAds = activeRealAds;

    // 3. Lista para o Dashboard (Veículos)
    const dashboardVehicleAds = getListOrUndefined(activeRealAds, ad => ad.category === 'veiculos')?.slice(0, 20);

    // 4. Destaques (Reais Pagos/Destaques)
    const displayFeaturedAds = getListOrUndefined(activeRealAds, ad =>
        ad.category === 'veiculos' &&
        (ad.isFeatured || ((ad as any).boostPlan && (ad as any).boostPlan !== 'gratis'))
    );

    // 5. Veículos na Feira (Lógica Atualizada)
    const fairAds = getListOrUndefined(activeRealAds, ad =>
        ad.category === 'veiculos' && (ad as any).isInFair === true
    );

    // 6. Lista Completa para o Admin - Veículos
    const allAdminVehicleAds = Array.isArray(adminAds) ? adminAds.filter(ad => ad.category === 'veiculos' || ad.category === 'autos') : [];

    // 7. Lista Completa para o Admin - Imóveis
    const allAdminRealEstateAds = Array.isArray(adminAds) ? adminAds.filter(ad => ad.category === 'imoveis') : [];

    // 8. Lista UNIFICADA para MODERAÇÃO
    const allModerationAds = Array.isArray(adminAds) ? adminAds : [];

    // 9. Lista Completa para o Admin - Peças e Serviços
    const allAdminPartsServicesAds = Array.isArray(adminAds) ? adminAds.filter(ad => ad.category === 'pecas' || ad.category === 'servicos') : [];

    // 10. Lista para Dashboard (Imóveis em Alta)
    // Passamos uma lista maior para que o componente TrendingRealEstateSection faça seu próprio score/filtro interno
    const dashboardRealEstateAds = getListOrUndefined(activeRealAds, ad => ad.category === 'imoveis')?.slice(0, 20);

    // 11. Lista para Página de Peças e Serviços
    const serviceAds = getListOrUndefined(activeRealAds, ad =>
        ad.category === 'servicos' || ad.category === 'pecas'
    );

    // --- LÓGICA DE MANUTENÇÃO (Moved from App.tsx) ---
    if (maintenanceMode && (!user || !user.isAdmin) && currentScreen !== Screen.LOGIN && currentScreen !== Screen.REGISTER && currentScreen !== Screen.FORGOT_PASSWORD) {
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

    const showBottomNav = currentScreen !== Screen.LOGIN && currentScreen !== Screen.REGISTER && currentScreen !== Screen.ACCEPT_TERMS && currentScreen !== Screen.FORGOT_PASSWORD && currentScreen !== Screen.EDIT_PROFILE && currentScreen !== Screen.CHANGE_PASSWORD && currentScreen !== Screen.CREATE_AD && currentScreen !== Screen.VEHICLE_DETAILS && currentScreen !== Screen.REAL_ESTATE_DETAILS && currentScreen !== Screen.PART_SERVICE_DETAILS && currentScreen !== Screen.PUBLIC_PROFILE && currentScreen !== Screen.CHAT_DETAIL && currentScreen !== Screen.ADMIN_PANEL && currentScreen !== Screen.ADMIN_USERS && currentScreen !== Screen.ADMIN_VEHICLES && currentScreen !== Screen.ADMIN_REAL_ESTATE && currentScreen !== Screen.ADMIN_PARTS_SERVICES && currentScreen !== Screen.ADMIN_SYSTEM_SETTINGS && currentScreen !== Screen.ADMIN_CONTENT_MODERATION && currentScreen !== Screen.ADMIN_DASHBOARD_PROMOTIONS && currentScreen !== Screen.ADMIN_REAL_ESTATE_PROMOTIONS && currentScreen !== Screen.ADMIN_PARTS_SERVICES_PROMOTIONS && currentScreen !== Screen.ADMIN_VEHICLES_PROMOTIONS && currentScreen !== Screen.TERMS_OF_USE && currentScreen !== Screen.PRIVACY_POLICY;

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

    const ctx: RouterContextProps = {
        state,
        actions,
        computed: {
            fairAds,
            displayFeaturedAds,
            dashboardVehicleAds,
            dashboardRealEstateAds,
            serviceAds,
            hasUnreadNotifications,
            allAdminVehicleAds,
            allAdminRealEstateAds,
            allModerationAds,
            allAdminPartsServicesAds,
            allNotifications
        },
        handlers: {
            handleBackFromDetails,
            handleBackFromProfile
        }
    };



    return (
        <div id="app-main-container" className="bg-gray-50 h-screen text-slate-800 font-sans max-w-md mx-auto shadow-2xl overflow-y-auto relative border-x border-gray-100">
            <ScrollToTop currentScreen={currentScreen} />


            {state.toast && (
                <Toast
                    message={state.toast.message}
                    type={state.toast.type}
                    onClose={() => state.setToast(null)}
                />
            )}

            {/* Feedback de Retorno de Pagamento (Mercado Pago) */}
            <PaymentStatusFeedback />

            {renderScreen(currentScreen, ctx)}

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
