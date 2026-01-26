import { api } from '../services/api';
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

  // Initialize state - CLEAN SLATE (No Mocks)
  const [user, setUser] = useState<User>(() => loadFromStorage('orca_user', CURRENT_USER));
  const [myAds, setMyAds] = useState<AdItem[]>([]); // Init empty, fetch later
  const [favorites, setFavorites] = useState<AdItem[]>(() => loadFromStorage('orca_favorites', [])); // Keep empty default

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);

  // Configurações do Sistema
  const [fairActive, setFairActive] = useState<boolean>(() => loadFromStorage('orca_fair_active', true));
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => loadFromStorage('orca_maintenance', false));

  // Global Ads State (Fetched from Supabase)
  const [realAds, setRealAds] = useState<AdItem[]>([]);

  // Fetch Data Effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Feed
        const ads = await api.getAds();
        if (ads) setRealAds(ads);

        // Fetch My Ads (if logged in)
        // Ideally we check if user.id is valid (not the mock default)
        // But fetchMyAds handles "no user" safely.
        const userAds = await api.getMyAds();
        if (userAds) setMyAds(userAds);

      } catch (error) {
        console.error("❌ Erro ao buscar dados:", error);
      }
    };

    fetchData();
  }, [user.id]); // Refetch if user changes

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
    // Default to empty or some static banner if desired, removing PROMO_BANNERS mock if requested.
    // Let's keep banners for now as they might be "system" config not "ads". 
    // User asked to remove "anuncios modelos" (model ads). Banners are structural. 
    // I'll keep them to avoid empty gray box, but maybe clear logic.
    // Let's keep existing logic for promotions for now as they are content-managed.
    return (PROMO_BANNERS as any[]).map((promo, index) => ({
      id: promo.id || `promo_${index}`,
      image: promo.image,
      title: promo.title,
      subtitle: promo.subtitle,
      link: promo.link || '#',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
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

  // Admin Mock Ads - Removed/Empty
  const [adminMockAds, setAdminMockAds] = useState<AdItem[]>([]);

  // States for flow
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [adToEdit, setAdToEdit] = useState<AdItem | undefined>(undefined);
  const [cameFromMyAds, setCameFromMyAds] = useState<boolean>(false);
  const [selectedChat, setSelectedChat] = useState<MessageItem | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // --- PERSISTÊNCIA ---
  useEffect(() => localStorage.setItem('orca_user', JSON.stringify(user)), [user]);
  // Don't persist myAds to localStorage excessively if we are syncing with DB, but keeping it for cache is ok.
  // Actually, let's stop writing myAds to LS to avoid 'stale' mock data fighting with DB.
  // useEffect(() => localStorage.setItem('orca_my_ads', JSON.stringify(myAds)), [myAds]); 

  useEffect(() => localStorage.setItem('orca_favorites', JSON.stringify(favorites)), [favorites]);
  // ... others ...

  // Flow Navigation State
  const [myAdsInitialTab, setMyAdsInitialTab] = useState<'ativos' | 'inativos' | 'pendentes'>('ativos');

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

    // Updated: Expose realAds
    activeRealAds: realAds,

    selectedAd, setSelectedAd,
    adToEdit, setAdToEdit,
    cameFromMyAds, setCameFromMyAds,
    selectedChat, setSelectedChat,
    viewingProfile, setViewingProfile,
    toast, setToast,
    myAdsInitialTab, setMyAdsInitialTab,
    dashboardPromotions, setDashboardPromotions,
    realEstatePromotions, setRealEstatePromotions,
    partsServicesPromotions, setPartsServicesPromotions,
    vehiclesPromotions, setVehiclesPromotions
  };
};
