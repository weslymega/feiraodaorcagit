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
  PROMO_BANNERS,
  TERMS_VERSION
} from '../constants';
import AdManager from '../services/AdManager';
import { setSentryUser } from '../services/sentry';

const adManager = AdManager.getInstance();

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
  const [sessionReady, setSessionReady] = useState<boolean>(false);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [retryProfileCount, setRetryProfileCount] = useState<number>(0);

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
  
  // Privacy: Bloqueios
  const [blockedByMe, setBlockedByMe] = useState<string[]>([]);
  const [blockedByOthers, setBlockedByOthers] = useState<string[]>([]);

  const isBlockedBetween = (id1: string, id2: string) => {
    if (!id1 || !id2) return false;
    const currentUserId = user?.id;
    if (!currentUserId) return false;

    // Se o alvo de interesse for id2, verificamos se EU bloqueei id2 ou se id2 me bloqueou
    const otherId = (id1 === currentUserId) ? id2 : id1;
    return blockedByMe.includes(otherId) || blockedByOthers.includes(otherId);
  };

  // 0. Inicialização Global de AdMob (Adiado por segurança)
  useEffect(() => {
    if (sessionReady) {
      console.log("[AdMob] 🚩 Inicialização global solicitada pelo Root");
      adManager.initialize();
    }
  }, [sessionReady]);

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

  // 1.2 Subscription Realtime para Status de Anúncios (Sincronização do Feed)
  useEffect(() => {
    console.log("📡 Subscribing to Anuncios Realtime (Status Sync)...");

    const channel = (supabase as any)
      .channel('public:anuncios_status')
      .on('postgres_changes', {
        event: 'UPDATE', // Monitorar mudanças de status
        schema: 'public',
        table: 'anuncios'
      }, (payload: any) => {
        const adId = payload.new.id;
        const newStatus = String(payload.new.status || '').toLowerCase();
        
        // Regra: Se o anúncio não for mais 'active' ou 'ativo', removemos do feed local
        const isActive = newStatus === 'active' || newStatus === 'ativo';

        if (!isActive) {
          console.log(`🚫 Anúncio ${adId} não é mais ativo (${newStatus}). Removendo do feed.`);
          setRealAds((prev: AdItem[]) => (prev || []).filter(ad => ad.id !== adId));
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
    // 1. Definição do mapeador de usuário (para consistência)
    const mapUser = (sessionUser: any): User => {
      // Prioritize metadata ONLY on first creation/registration
      // For persistent sessions, the profiles table is our Single Source of Truth
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.name || "Usuário",
        avatarUrl: sessionUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${sessionUser.email}&background=random`,
        balance: 0,
        adsCount: 0,
        activePlan: 'free',
        isAdmin: false,
        verified: !!sessionUser.email_confirmed_at,
        joinDate: new Date(sessionUser.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        phone: "",
        location: "Brasília, DF",
        bio: "",
        emailConfirmedAt: sessionUser.email_confirmed_at,
        // --- PERSISTÊNCIA EM DUAS CAMADAS (Otimização Local) ---
        acceptedTerms: (localStorage.getItem("termsAccepted") === "true" && localStorage.getItem("termsVersion") === TERMS_VERSION) 
          || !!sessionUser.user_metadata?.accepted_terms 
          || !!sessionUser.user_metadata?.terms_accepted,
        termsAccepted: localStorage.getItem("termsAccepted") === "true" && localStorage.getItem("termsVersion") === TERMS_VERSION,
        termsVersion: localStorage.getItem("termsVersion") || sessionUser.user_metadata?.terms_version
      };
    };

    // 2. Verificação de sessão inicial (Cold Boot)
    const initSession = async () => {
      console.log("🔐 [Auth] Initializing session check...");
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          // Health Check: Verificando se o token ainda é aceito pelo servidor
          // Isso evita erros 401 residuais bloqueando o app
          const { error: userError } = await supabase.auth.getUser();

          if (userError) {
            console.warn("⚠️ [Auth] Sessão existente é inválida ou expirou. Limpando...", userError.message);
            // Limpeza agressiva para garantir que o app volte ao estado Guest
            await supabase.auth.signOut().catch(() => { });
            localStorage.removeItem('orca_user');

            setUser(null);
            setCurrentScreen(Screen.LOGIN);
          } else {
            console.log("✅ [Auth] Session found for user:", session.user.id);
            authenticatedUserIdRef.current = session.user.id;
            setUser(mapUser(session.user));
            setCurrentScreen(Screen.DASHBOARD);
          }
        } else {
          console.log("📍 [Auth] No initial session found.");
          setUser(null);
          setCurrentScreen(Screen.LOGIN);
        }
      } catch (err) {
        console.error("❌ [Auth] Error getting session:", err);
        // Em caso de erro crítico na lib (ex: token corrompido que faz a lib travar)
        setUser(null);
        setCurrentScreen(Screen.LOGIN);
      } finally {
        setAuthInitialized(true);
        setSessionReady(true);
      }
    };

    initSession();

    // 3. Listener de mudanças de estado (Event-driven)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 [Auth] State Change Event:", event, session?.user?.id);

      if (event === 'SIGNED_OUT') {
        authenticatedUserIdRef.current = null;
        setUser(null);
        setProfileLoaded(false);
        setCurrentScreen(Screen.LOGIN);
        setIsAppReady(true);
        // Limpa o contexto de usuário no Sentry — NUNCA usar await
        setSentryUser(null);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        isRecoveringRef.current = true;
        setCurrentScreen(Screen.RESET_PASSWORD);
        setIsAppReady(true);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const isNewUser = authenticatedUserIdRef.current !== session.user.id;

        if (isNewUser) {
          console.log("✅ [Auth] User signed in:", session.user.id);
          authenticatedUserIdRef.current = session.user.id;
          setUser(mapUser(session.user));

          if (isRecoveringRef.current) {
            isRecoveringRef.current = false;
            setCurrentScreen(Screen.RESET_PASSWORD);
          } else {
            setCurrentScreen(Screen.DASHBOARD);
          }

          // Se for uma mudança após o boot, precisamos recarregar os dados
          setIsAppReady(false);
          setLoadingMessage("");
        } else {
          console.log("ℹ️ [Auth] Session refreshed for same user.");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Data Effect State
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Guardião de Sessão: Não faz nada antes da sessão estar pronta
    if (!sessionReady) return;

    // Se a app já estiver pronta para o usuário atual, não refetch
    if (lastFetchedUserIdRef.current === user?.id && isAppReady && realAds.length > 0) {
      return;
    }

    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      console.log(`[Data-Flow] 🚀 Carregando dados. Usuário: ${user?.id || 'Public'}`);
      lastFetchedUserIdRef.current = user?.id || null;

      const softTimeout = setTimeout(() => {
        setLoadingMessage("Sincronizando dados...");
      }, 2500);

      try {
        // A. BUSCAS PÚBLICAS (Sempre executa se estiverem vazias)
        if (realAds.length === 0) {
          const ads = await api.getAds();
          if (ads) setRealAds(ads);
        }

        // B. BUSCAS PRIVADAS (Apenas se o usuário estiver logado)
        if (user?.id) {
          const freshProfile = await api.getProfile();
          if (freshProfile) {
            if (freshProfile.deletedAt) {
              console.log("🚫 [Auth] Conta excluída detectada. Deslogando...");
              await supabase.auth.signOut();
              setUser(null);
              setSentryUser(null);
              setCurrentScreen(Screen.LOGIN);
              alert("Esta conta foi excluída e não pode mais ser acessada.");
              return;
            }

            setUser(prev => prev ? ({ ...prev, ...freshProfile }) : null);
            setProfileLoaded(true);
            setRetryProfileCount(0); // Reset on success
            // Associa o UUID ao contexto do Sentry — sem PII, apenas ID interno
            // NUNCA usar await — fire and forget
            setSentryUser(freshProfile.id);
            
            // --- VALIDAÇÃO FINAL (Fonte da Verdade: Supabase) ---
            // Verifica tanto o campo legado quanto o novo com versionamento
            const hasAcceptedCurrentVersion = (freshProfile.termsAccepted || freshProfile.acceptedTerms) && 
                                              freshProfile.termsVersion === TERMS_VERSION;

            if (!hasAcceptedCurrentVersion) {
              console.log("⚠️ [Auth] Aceite de termos ausente ou versão obsoleta no DB. Redirecionando...");
              // Limpa otimização local se o DB diz que não vale
              localStorage.removeItem("termsAccepted");
              localStorage.removeItem("termsVersion");
              setCurrentScreen(Screen.ACCEPT_TERMS);
            } else {
              // Sincroniza Local Storage com o DB (Garante persistência para reabertura)
              localStorage.setItem("termsAccepted", "true");
              localStorage.setItem("termsVersion", TERMS_VERSION);
            }
          } else {
            // Profile not found yet (race condition with trigger)
            console.log(`⏳ [Data-Flow] Perfil não encontrado. Tentativa de retry ${retryProfileCount + 1}...`);
            
            if (retryProfileCount < 5) {
              setTimeout(() => setRetryProfileCount(prev => prev + 1), 2000);
            } else {
              console.error("❌ [Data-Flow] Falha crítica: Perfil não sincronizou após várias tentativas.");
              setProfileLoaded(true); // Unblock to avoid infinite loading, but state will be inconsistent
            }
          }

          // 🚀 FASE 1: OTIMIZAÇÃO DO LOADING PÓS-LOGIN (NÃO-BLOQUEANTE)
          
          // 1. CARREGAMENTO ESSENCIAL (Bloqueante para o Dashboard básico)
          const essentialTasks = [
            api.getMyAds().then(res => res && setMyAds(res)),
            api.getPromotions('dashboard').then(res => res.length > 0 && setDashboardPromotions(res)),
            api.getFavorites().then(res => res && setFavorites(res)),
            api.getUserConversations().then(res => res && setConversations(res)),
            api.getBlockedUserIds().then(res => res && setBlockedByMe(res)),
            api.getWhoBlockedMeIds().then(res => res && setBlockedByOthers(res))
          ];

          await Promise.allSettled(essentialTasks);

          // 2. CARREGAMENTO SECUNDÁRIO (Background / Sem travar a UI)
          const loadSecondaryData = () => {
             Promise.allSettled([
                api.getPromotions('veiculos').then(res => res.length > 0 && setVehiclesPromotions(res)),
                api.getPromotions('imoveis').then(res => res.length > 0 && setRealEstatePromotions(res)),
                api.getPromotions('pecas_servicos').then(res => res.length > 0 && setPartsServicesPromotions(res))
             ]);

             // Carrega dados de ADMIN APENAS se o usuário for administrador
             const isAdminInDB = freshProfile?.isAdmin || user.isAdmin || freshProfile?.role === 'admin';
             if (isAdminInDB) {
                Promise.allSettled([
                   api.getAllAdsForAdmin().then(res => res && setAdminAds(res)),
                   api.getReports().then(reportsData => {
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
                   })
                ]);
             }
          };

          // Dispara carregamento secundário sem aguardar (`await`)
          loadSecondaryData();
        }
      } catch (error) {
        console.error("[Data-Flow] ❌ Erro ao buscar dados:", error);
      } finally {
        clearTimeout(softTimeout);
        isFetchingRef.current = false;
        setLoadingMessage("");
        setIsAppReady(true);
      }
    };

    fetchData();
  }, [user?.id, sessionReady, retryProfileCount]);

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

  // Pending Highlight State (Flow: Create Ad -> My Ads -> Highlight Modal)
  const [pendingHighlightAd, setPendingHighlightAd] = useState<{ adId: string, planId: string } | null>(null);

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
    sessionReady, setSessionReady,
    loadingMessage,
    profileLoaded,
    authLoading, setAuthLoading,
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
    chatMessages, setChatMessages,
    pendingHighlightAd, setPendingHighlightAd,
    blockedByMe, setBlockedByMe,
    blockedByOthers, setBlockedByOthers,
    isBlockedBetween
  };
};
