import { useState, useEffect } from 'react';
import { Screen, User, AdItem, MessageItem, NotificationItem, ReportItem, FilterContext, DashboardPromotion, RealEstatePromotion, PartsServicesPromotion, VehiclesPromotion } from '../types';
import {
  CURRENT_USER,
  MY_ADS_DATA,
  FAVORITES_DATA,
  MOCK_ADMIN_VEHICLES,
  MOCK_ADMIN_REAL_ESTATE,
  MOCK_ADMIN_PARTS_SERVICES,
  MOCK_NOTIFICATIONS,
  MOCK_REPORTS,
  PROMO_BANNERS
} from '../constants';

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

export const useAppState = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [previousScreen, setPreviousScreen] = useState<Screen>(Screen.DASHBOARD);

  // Temporary Filter Context
  const [filterContext, setFilterContext] = useState<FilterContext | null>(null);

  // Initialize state from LocalStorage
  const [user, setUser] = useState<User>(() => loadFromStorage('orca_user', CURRENT_USER));
  const [myAds, setMyAds] = useState<AdItem[]>(() => loadFromStorage('orca_my_ads', MY_ADS_DATA));
  const [favorites, setFavorites] = useState<AdItem[]>(() => loadFromStorage('orca_favorites', FAVORITES_DATA));
  // Removed the old realEstateAds declaration here as it's moved below

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadFromStorage('orca_notifications', MOCK_NOTIFICATIONS));
  const [reports, setReports] = useState<ReportItem[]>(() => loadFromStorage('orca_reports', MOCK_REPORTS));

  // Configurações do Sistema
  const [fairActive, setFairActive] = useState<boolean>(() => loadFromStorage('orca_fair_active', true));

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => loadFromStorage('orca_maintenance', false));

  // Dashboard Promotions State
  const [dashboardPromotions, setDashboardPromotions] = useState<DashboardPromotion[]>(() => {
    const saved = localStorage.getItem('orca_dashboard_promotions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing dashboard promotions", e);
      }
    }

    // Fallback and initial mapping from constants
    // PROMO_BANNERS is already imported at the top
    return (PROMO_BANNERS as any[]).map((promo, index) => ({
      id: promo.id || `promo_${index}`,
      image: promo.image,
      title: promo.title,
      subtitle: promo.subtitle,
      link: promo.link || '#',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days from now
      active: true,
      order: index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  });

  // Real Estate Promotions State
  const [realEstatePromotions, setRealEstatePromotions] = useState<RealEstatePromotion[]>(() => {
    return loadFromStorage<RealEstatePromotion[]>('orca_realestate_promotions', []);
  });

  // Parts & Services Promotions State
  const [partsServicesPromotions, setPartsServicesPromotions] = useState<PartsServicesPromotion[]>(() => {
    return loadFromStorage<PartsServicesPromotion[]>('orca_parts_services_promotions', []);
  });

  // Vehicles Promotions State
  const [vehiclesPromotions, setVehiclesPromotions] = useState<VehiclesPromotion[]>(() => {
    return loadFromStorage<VehiclesPromotion[]>('orca_vehicles_promotions', []);
  });

  // Estado local para anúncios do admin (mocks) - Mantido caso precise resetar, mas o fluxo principal usa as listas acima
  const [adminMockAds, setAdminMockAds] = useState<AdItem[]>(MOCK_ADMIN_VEHICLES);

  // States for flow
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [adToEdit, setAdToEdit] = useState<AdItem | undefined>(undefined);
  const [cameFromMyAds, setCameFromMyAds] = useState<boolean>(false);
  const [selectedChat, setSelectedChat] = useState<MessageItem | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // --- PERSISTÊNCIA ---
  useEffect(() => localStorage.setItem('orca_user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('orca_my_ads', JSON.stringify(myAds)), [myAds]);
  useEffect(() => localStorage.setItem('orca_favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('orca_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('orca_reports', JSON.stringify(reports)), [reports]);
  useEffect(() => localStorage.setItem('orca_fair_active', JSON.stringify(fairActive)), [fairActive]);
  useEffect(() => localStorage.setItem('orca_maintenance', JSON.stringify(maintenanceMode)), [maintenanceMode]);
  useEffect(() => {
    localStorage.setItem('orca_dashboard_promotions', JSON.stringify(dashboardPromotions));
  }, [dashboardPromotions]);

  useEffect(() => {
    localStorage.setItem('orca_realestate_promotions', JSON.stringify(realEstatePromotions));
  }, [realEstatePromotions]);

  useEffect(() => {
    localStorage.setItem('orca_parts_services_promotions', JSON.stringify(partsServicesPromotions));
  }, [partsServicesPromotions]);

  useEffect(() => {
    localStorage.setItem('orca_vehicles_promotions', JSON.stringify(vehiclesPromotions));
  }, [vehiclesPromotions]);


  return {
    currentScreen, setCurrentScreen,
    previousScreen, setPreviousScreen,
    filterContext, setFilterContext,
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
    dashboardPromotions, setDashboardPromotions,
    realEstatePromotions, setRealEstatePromotions,
    partsServicesPromotions, setPartsServicesPromotions,
    vehiclesPromotions, setVehiclesPromotions
  };
};
