import { api, supabase } from '../services/api';
import { useState, useEffect } from 'react';
import { Screen, User, AdItem, MessageItem, ChatMessage, NotificationItem, ReportItem, FilterContext, DashboardPromotion, RealEstatePromotion, PartsServicesPromotion, VehiclesPromotion } from '../types';
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

  // Configurações do Sistema (Realtime Pure - No localStorage)
  const [fairActive, setFairActive] = useState<boolean>(false);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  // Global Ads State (Fetched from Supabase)
  const [realAds, setRealAds] = useState<AdItem[]>([]);
  const [adminAds, setAdminAds] = useState<AdItem[]>([]);

  // Chat/Messages state
  const [conversations, setConversations] = useState<MessageItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 1. Subscription Realtime para Configurações Globais
  useEffect(() => {
    console.log("📡 Subscribing to System Settings Realtime...");

    // FETCH INICIAL
    const loadSettings = async () => {
      try {
        const settings = await api.getSystemSettings();
        if (settings) {
          setFairActive(settings.fair_active);
          setMaintenanceMode(settings.maintenance_mode);
        }
      } catch (err) {
        console.error("⚠️ Falha ao carregar system_settings inicial:", err);
      }
    };
    loadSettings();

    const channel = (supabase as any)
      .channel('public:system_settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'system_settings'
      }, (payload: any) => {
        console.log("⚙️ Mudança Global Detectada:", payload.new);
        const next = payload.new;
        if (next.id === true) {
          setFairActive(next.fair_active);
          setMaintenanceMode(next.maintenance_mode);
        }
      })
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, []);

  // Fetch Data Effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Feed (Active Only)
        console.log("🔄 Fetching Public Feed...");
        const ads = await api.getAds();
        if (ads) setRealAds(ads);

        // Fetch My Ads (if logged in)
        console.log("🔄 Fetching My Ads...");
        const userAds = await api.getMyAds();
        if (userAds) setMyAds(userAds);

        // FORCE SYNC: Check if user is REALLY admin in DB
        const freshProfile = await api.getProfile();
        console.log("👤 Fresh Profile Fetch:", freshProfile);

        if (freshProfile) {
          setUser(prev => ({ ...prev, ...freshProfile }));
        }

        const isAdminInDB = freshProfile?.isAdmin || false;

        // Fetch Reports & ALL ADS (if admin)
        if (isAdminInDB) {
          console.log("🛡️ Admin Detected in DB. Fetching ALL ads...");
          const allAdsData = await api.getAllAdsForAdmin();
          if (allAdsData) setAdminAds(allAdsData);

          const reportsData = await api.getReports();
          if (reportsData) {
            const mappedReports = reportsData.map((r: any) => ({
              id: r.id,
              targetId: r.target_id || r.ad_id,
              targetName: r.target_name || (r.ads?.title) || 'Alvo desconhecido',
              targetType: r.target_type || (r.ad_id ? 'ad' : 'user'),
              targetImage: r.target_image || (r.ads?.image) || null,
              reportedUserId: r.reported_user_id || (r.ads?.user_id) || null,
              reason: r.reason,
              description: r.description,
              reporterId: r.reporter_id,
              reporterName: r.reporter?.name || 'Anon',
              severity: r.severity || 'medium',
              status: r.status,
              date: new Date(r.created_at).toLocaleDateString('pt-BR')
            } as ReportItem));
            setReports(mappedReports);
          }
        }

        // Fetch Conversations
        console.log("💬 Fetching Conversations...");
        const convs = await api.getUserConversations();
        if (convs) setConversations(convs);

        // Fetch Favorites
        console.log("❤️ Fetching Favorites...");
        const favs = await api.getFavorites();
        if (favs) setFavorites(favs);

        // Fetch Promotions
        console.log("📣 Fetching Promotions...");
        const dPromos = await api.getPromotions('dashboard');
        if (dPromos.length > 0) setDashboardPromotions(dPromos);

        const vPromos = await api.getPromotions('veiculos');
        if (vPromos.length > 0) setVehiclesPromotions(vPromos);

        const rPromos = await api.getPromotions('imoveis');
        if (rPromos.length > 0) setRealEstatePromotions(rPromos);

        const pPromos = await api.getPromotions('pecas_servicos');
        if (pPromos.length > 0) setPartsServicesPromotions(pPromos);

      } catch (error) {
        console.error("❌ Erro ao buscar dados:", error);
      }
    };

    fetchData();
  }, [user.id]); // Refetch if user changes

  // Dashboard Promotions State
  const [dashboardPromotions, setDashboardPromotions] = useState<DashboardPromotion[]>([]);

  // Real Estate Promotions State
  const [realEstatePromotions, setRealEstatePromotions] = useState<RealEstatePromotion[]>([]);

  // Parts & Services Promotions State
  const [partsServicesPromotions, setPartsServicesPromotions] = useState<PartsServicesPromotion[]>([]);

  // Vehicles Promotions State
  const [vehiclesPromotions, setVehiclesPromotions] = useState<VehiclesPromotion[]>([]);

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

    // Updated: Expose realAds and setter
    activeRealAds: realAds, setRealAds,
    adminAds, setAdminAds, // NEW: Expose Admin Ads

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
    vehiclesPromotions, setVehiclesPromotions,
    conversations, setConversations,
    chatMessages, setChatMessages
  };
};
