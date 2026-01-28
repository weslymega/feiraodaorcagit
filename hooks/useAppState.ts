import { api, supabase } from '../services/api';
import { useState, useEffect, useRef } from 'react';
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

  // App Ready State (Interaction Lock)
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  // Temporary Filter Context
  const [filterContext, setFilterContext] = useState<FilterContext | null>(null);

  // Initialize state - CLEAN SLATE (No Mocks)
  // CRITICAL: Default to null until session is confirmed
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  const [myAds, setMyAds] = useState<AdItem[]>([]);
  const [favorites, setFavorites] = useState<AdItem[]>(() => loadFromStorage('orca_favorites', []));

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

  // 1.1 Auth State Change Listener (Single Source of Truth)
  // Guard to prevent duplicate SIGNED_IN processing (fixes infinite loop)
  const authenticatedUserIdRef = useRef<string | null>(null);
  const isRecoveringRef = useRef<boolean>(false);
  const authInitializedRef = useRef<boolean>(false);

  // Sincronizar ref com estado para uso dentro do listener (que tem closure fixa)
  useEffect(() => {
    authInitializedRef.current = authInitialized;
  }, [authInitialized]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth State Change:", event, session?.user?.id);

      // REGRA 5: INITIAL_SESSION não deve interromper o boot se houver sessão
      if (event === 'INITIAL_SESSION') {
        console.log("📍 Initial session check complete.");
        if (!session) {
          console.log("📍 No initial session found, showing login.");
          setUser(null);
          setCurrentScreen(Screen.LOGIN);
          setAuthInitialized(true);
          setIsAppReady(true);
          return;
        }
        // Se houver sessão, o fluxo continua para o processamento do usuário abaixo
      }

      const isRecoveryEvent = event === 'PASSWORD_RECOVERY';
      if (isRecoveryEvent) {
        console.log("🔑 Password Recovery event detected.");
        isRecoveringRef.current = true;
        setCurrentScreen(Screen.RESET_PASSWORD);
        setIsAppReady(true);
        setAuthInitialized(true);
        return;
      }

      if ((event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) && session?.user) {
        // Identificar se é um login novo (estava deslogado ou mudou de usuário)
        const isNewLogin = authenticatedUserIdRef.current !== session.user.id;
        const isBoot = !authInitializedRef.current;

        // REGRA 2 & 4: Auth NÃO pode redirecionar ou resetar appReady se JÁ estiver estável
        if (!isBoot && !isNewLogin) {
          console.log(`⚠️ Stable session for user ${session.user.id}, ignoring duplicate/refresh event`);
          return;
        }

        console.log("✅ Processing auth event for user:", session.user.id);
        authenticatedUserIdRef.current = session.user.id;

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || "Usuário",
          avatarUrl: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session.user.email}&background=random`,
          balance: 0,
          adsCount: 0,
          activePlan: 'free',
          isAdmin: false,
          verified: !!session.user.email_confirmed_at,
          joinDate: new Date(session.user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          phone: "",
          location: "Brasília, DF",
          bio: ""
        });

        // REGRA 3: Overlay global só em "Login inicial" (novo login) ou "Restauração de boot"
        if (isBoot || isNewLogin) {
          console.log(`🚀 ${isBoot ? 'Boot Restoration' : 'Initial Login'} detected. Preparing Dashboard.`);
          setIsAppReady(false); // Bloqueia para carregar dados do Dashboard
          setLoadingMessage("");

          if (isRecoveringRef.current) {
            console.log("🛡️ Staying on RESET_PASSWORD due to recovery.");
            isRecoveringRef.current = false;
            setCurrentScreen(Screen.RESET_PASSWORD);
          } else {
            setCurrentScreen(Screen.DASHBOARD);
            console.log("✅ User authenticated, navigating to Dashboard");
          }
        }

        setAuthInitialized(true);

      } else if (event === 'SIGNED_OUT') {
        authenticatedUserIdRef.current = null;
        setUser(null);
        setCurrentScreen(Screen.LOGIN);
        setIsAppReady(true);
        setAuthInitialized(true); // Garante que o estado de "boot" terminou
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // REGRA 1: Auth NÃO pode depender de currentScreen

  // Fetch Data Effect State
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    // CRITICAL SECURITY GUARD: Do not fetch if auth is not initialized or no user
    if (!authInitialized || !user || !user.id || user.id === 'guest') {
      if (authInitialized && (!user || user.id === 'guest')) {
        setIsAppReady(true);
      }
      return;
    }

    if (lastFetchedUserIdRef.current === user.id && isAppReady) {
      return;
    }

    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      console.log(`[Dashboard-Loading] 🚀 Iniciando carregamento para usuário: ${user.id}`);
      lastFetchedUserIdRef.current = user.id;

      // 1. Safeguard: Soft & Hard Timeouts
      const softTimeout = setTimeout(() => {
        setLoadingMessage("Estamos carregando seus dados...");
      }, 3000);

      const hardTimeout = setTimeout(() => {
        console.warn("[Dashboard-Loading] ⚠️ HARD TIMEOUT! Liberando interface.");
        setIsAppReady(true);
      }, 8000);

      try {
        // 2. CRITICAL SYNC DATA
        const ads = await api.getAds();
        if (ads) setRealAds(ads);

        const freshProfile = await api.getProfile();
        if (freshProfile) {
          setUser(prev => prev ? ({ ...prev, ...freshProfile }) : null);
        }

        // 3. PARALLEL NON-BLOCKING DATA
        const parallelTasks = [
          api.getMyAds().then(res => res && setMyAds(res)),
          api.getUserConversations().then(res => res && setConversations(res)),
          api.getFavorites().then(res => res && setFavorites(res)),
          api.getPromotions('dashboard').then(res => res.length > 0 && setDashboardPromotions(res)),
          api.getPromotions('veiculos').then(res => res.length > 0 && setVehiclesPromotions(res)),
          api.getPromotions('imoveis').then(res => res.length > 0 && setRealEstatePromotions(res)),
          api.getPromotions('pecas_servicos').then(res => res.length > 0 && setPartsServicesPromotions(res))
        ];

        const isAdminInDB = freshProfile?.isAdmin || user.isAdmin;
        if (isAdminInDB) {
          parallelTasks.push(api.getAllAdsForAdmin().then(res => res && setAdminAds(res)));
          parallelTasks.push(api.getReports().then(reportsData => {
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
          }));
        }

        await Promise.allSettled(parallelTasks);
      } catch (error) {
        console.error("[Dashboard-Loading] ❌ Erro:", error);
      } finally {
        clearTimeout(softTimeout);
        clearTimeout(hardTimeout);
        isFetchingRef.current = false;
        setLoadingMessage("");
        setIsAppReady(true);
      }
    };

    fetchData();

    // Cleanup function para o useEffect
    return () => {
    };
  }, [user?.id, authInitialized]); // Fix: Re-run when auth initializes to avoid F5 race condition

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
  useEffect(() => {
    if (user) {
      localStorage.setItem('orca_user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => localStorage.setItem('orca_favorites', JSON.stringify(favorites)), [favorites]);
  // ... others ...

  // Flow Navigation State
  const [myAdsInitialTab, setMyAdsInitialTab] = useState<'ativos' | 'inativos' | 'pendentes'>('ativos');

  return {
    currentScreen, setCurrentScreen,
    previousScreen, setPreviousScreen,
    filterContext, setFilterContext,
    isAppReady, setIsAppReady,
    authInitialized, setAuthInitialized,
    loadingMessage,
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
