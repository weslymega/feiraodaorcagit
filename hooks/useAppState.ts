import { api, supabase } from '../services/api';
import { App as CapApp } from '@capacitor/app';
import { authService, AuthEvent } from '../services/authService';
import { Capacitor } from '@capacitor/core';
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

/**
 * Helper para mapear usuário da sessão para o modelo interno da App.
 */
const mapUser = (sessionUser: any): User => {
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
    acceptedTerms: (localStorage.getItem("termsAccepted") === "true" && localStorage.getItem("termsVersion") === TERMS_VERSION) 
      || !!sessionUser.user_metadata?.accepted_terms 
      || !!sessionUser.user_metadata?.terms_accepted,
    termsAccepted: localStorage.getItem("termsAccepted") === "true" && localStorage.getItem("termsVersion") === TERMS_VERSION,
    termsVersion: localStorage.getItem("termsVersion") || sessionUser.user_metadata?.terms_version
  };
};

export const useAppState = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [previousScreen, setPreviousScreen] = useState<Screen>(Screen.DASHBOARD);

  // App Ready State (Interaction Lock)
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  // Temporary Filter Context
  const [filterContext, setFilterContext] = useState<FilterContext | null>(null);

  // --- HARDENING: SISTEMA DE SINCRONIZAÇÃO DETERMINÍSTICA ---
  const activeLocksRef = useRef<Map<string, { expectedUpdateAt: string, startTime: number }>>(new Map());
  const ENABLE_REALTIME_TURBO_SYNC = true;

  // --- AUTH HYDRATION GATE (STATE MACHINE) ---
  // initializing -> resolved -> ready
  const [authStatus, setAuthStatus] = useState<'initializing' | 'resolved' | 'ready'>(() => {
    const session = authService.getSession();
    return session ? 'resolved' : 'initializing';
  });
  
  // Clean Slate State
  const [user, setUser] = useState<User | null>(() => {
    const session = authService.getSession();
    return session ? mapUser(session.user) : null;
  });
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(() => !authService.getSession());
  
  // Legacy support for App.tsx (maintained for compatibility)
  const authInitialized = authStatus !== 'initializing';
  const sessionReady = authStatus === 'resolved' || authStatus === 'ready';
  
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
    // GATE: Não inicia subscriptions sem resolução de auth
    if (authStatus === 'initializing') return;

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

  // 1.2 Subscription Realtime para Status de Anúncios (Sincronização do Feed & ACK Flow)
  useEffect(() => {
    // GATE: Não inicia subscriptions sem resolução de auth
    if (authStatus === 'initializing') return;
    if (!ENABLE_REALTIME_TURBO_SYNC) return;

    console.log("📡 Subscribing to Anuncios Realtime (Hardened Sync & ACK Flow)...");

    const channel = (supabase as any)
      .channel('public:anuncios_status')
      .on('postgres_changes', {
        event: 'UPDATE', 
        schema: 'public',
        table: 'anuncios'
      }, (payload: any) => {
        const newAd = payload.new;
        const adId = newAd.id;
        
        // 1. VERSIONAMENTO LÓGICO: Verificar se o evento é mais recente que o esperado
        const currentLock = activeLocksRef.current.get(adId);
        
        if (currentLock) {
          const incomingTS = new Date(newAd.updated_at || 0).getTime();
          const expectedTS = new Date(currentLock.expectedUpdateAt || 0).getTime();

          if (incomingTS < expectedTS) {
            console.log(`[Sync-Hardening] ⏳ Evento Realtime ignorado para ${adId}: Evento antigo recebido.`);
            return;
          }

          if (incomingTS === expectedTS) {
            console.log(`[Sync-Hardening] ✅ ACK Confirmado via Realtime para ${adId}. Liberando lock.`);
            activeLocksRef.current.delete(adId);
          } else if (incomingTS > expectedTS) {
            console.log(`[Sync-Hardening] 🚀 Mudança externa mais recente detectada para ${adId}. Liberando lock.`);
            activeLocksRef.current.delete(adId);
          }
        }

        // 2. ATUALIZAÇÃO DETERMINÍSTICA (Substituição Completa)
        // Mapeamos os dados brutos do Supabase para o nosso AdItem usando os padrões do api.ts
        // Nota: Idealmente o api.ts teria um export do mapAdData público
        const adStatus = String(newAd.status || '').toLowerCase();
        const isActive = adStatus === 'active' || adStatus === 'ativo';

        if (!isActive) {
          console.log(`🚫 Anúncio ${adId} não é mais ativo. Removendo do feed.`);
          setRealAds((prev: AdItem[]) => (prev || []).filter(ad => ad.id !== adId));
          setMyAds((prev: AdItem[]) => prev.map(ad => ad.id === adId ? { ...ad, status: AdStatus.INACTIVE } : ad));
        } else {
          // Update genérico para manter sincronismo de turbo e outros campos
          const updateItem = (item: AdItem) => {
            if (item.id !== adId) return item;

            // Diff Check SIMPLIFICADO para evitar re-render se nada mudou
            const hasChanges = item.status !== (newAd.status || item.status) || 
                               item.turbo_progress !== (newAd.turbo_progress ?? item.turbo_progress) ||
                               item.turbo_expires_at !== (newAd.turbo_expires_at ?? item.turbo_expires_at);

            if (!hasChanges) return item;

            return {
              ...item,
              status: (newAd.status ? (AdStatus as any)[newAd.status.toUpperCase()] : item.status) || item.status,
              turbo_progress: newAd.turbo_progress ?? item.turbo_progress,
              turbo_expires_at: newAd.turbo_expires_at ?? item.turbo_expires_at,
              is_turbo_active: !!newAd.turbo_expires_at && new Date(newAd.turbo_expires_at) > new Date(),
              lastUpdateSource: 'realtime',
              syncVersion: newAd.updated_at
            };
          };

          setRealAds((prev: AdItem[] = []) => prev.map(updateItem));
          setMyAds((prev: AdItem[] = []) => prev.map(updateItem));
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

  const currentScreenRef = useRef<Screen>(currentScreen);
  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  const handleAuthChange = async (event: AuthEvent, session: any) => {
    const sessionUserId = session?.user?.id;
    const currentUserId = authenticatedUserIdRef.current;

    const isSameUser = sessionUserId === currentUserId;
    const isRoutineEvent = event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED';
    
    if (isRoutineEvent && isSameUser && (authStatus === 'ready' || authStatus === 'resolved')) {
      console.log(`♻️ [Auth Hydration] Evento ${event} ignorado (Já estamos sincronizados para este usuário).`);
      return;
    }

    console.log(`🔐 [Auth Hydration] Evento: ${event} | Status Atual: ${authStatus}`, sessionUserId);
    
    if (event === 'SIGNED_OUT') {
      authenticatedUserIdRef.current = null;
      setUser(null);
      setProfileLoaded(false);
      setCurrentScreen(Screen.LOGIN);
      setIsAppReady(true);
      setSentryUser(null);
      setAuthLoading(false);
      setAuthStatus('resolved');
      return;
    }

    if (event === 'PASSWORD_RECOVERY') {
      isRecoveringRef.current = true;
      setCurrentScreen(Screen.RESET_PASSWORD);
      setIsAppReady(true);
      setAuthLoading(false);
      setAuthStatus('resolved');
      return;
    }

    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
      const isNewUser = authenticatedUserIdRef.current !== session.user.id;
      authenticatedUserIdRef.current = session.user.id;
      
      const mappedUser = mapUser(session.user);
      setUser(mappedUser);

      if (currentScreenRef.current === Screen.LOGIN || currentScreenRef.current === Screen.SPLASH) {
        if (isRecoveringRef.current) {
          isRecoveringRef.current = false;
          setCurrentScreen(Screen.RESET_PASSWORD);
        } else {
          setCurrentScreen(Screen.DASHBOARD);
        }
      }

      if (isNewUser) {
        setIsAppReady(false);
        setLoadingMessage("");
        setProfileLoaded(false);
      }
      
      setAuthStatus('resolved');
    } else if (event === 'INITIAL_SESSION' && !session) {
      console.log('👤 [Auth Hydration] Nenhum usuário logado. Pronto para Login.');
      setUser(null);
      authenticatedUserIdRef.current = null;
      setAuthStatus('resolved');
    }

    setAuthLoading(false);
  };

  const handleAuthChangeRef = useRef(handleAuthChange);
  useEffect(() => {
    handleAuthChangeRef.current = handleAuthChange;
  }, [handleAuthChange]);

  useEffect(() => {
    const unsubscribe = authService.subscribe((e, s) => handleAuthChangeRef.current(e, s));
    return () => unsubscribe();
  }, []);

  // Fetch Data Effect State
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Guardião de Sessão: Absolutamente nada antes de authStatus ser 'resolved'
    if (authStatus === 'initializing') return;

    // Se não temos usuário, já estamos "prontos" (no sentido de auth resolvido para login)
    if (!user?.id) {
      setIsAppReady(true);
      return;
    }

    // Se o perfil já está carregado para este usuário, não refetch desnecessário
    if (lastFetchedUserIdRef.current === user.id && profileLoaded) {
      setAuthStatus('ready');
      return;
    }

    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      console.log(`📡 [Auth Hydration] 🚀 Iniciando fetchData. Usuário: ${user.id} | Status: ${authStatus}`);
      lastFetchedUserIdRef.current = user.id;

      const softTimeout = setTimeout(() => {
        setLoadingMessage("Sincronizando dados...");
      }, 2500);

      try {
        console.log("📡 [Auth Hydration] Carregando perfil principal...");
        const freshProfile = await api.getProfile();

        if (freshProfile) {
          if (freshProfile.deletedAt) {
            console.log("🚫 [Auth Hydration] Conta excluída detectada. Deslogando...");
            await supabase.auth.signOut();
            setUser(null);
            setSentryUser(null);
            setCurrentScreen(Screen.LOGIN);
            setAuthStatus('resolved');
            alert("Esta conta foi excluída e não pode mais ser acessada.");
            return;
          }

          setUser(prev => prev ? ({ ...prev, ...freshProfile }) : null);
          setProfileLoaded(true);
          setRetryProfileCount(0);
          setSentryUser(freshProfile.id);
          
          // Validação de termos...
          const hasValidity = (freshProfile.termsAccepted || freshProfile.acceptedTerms) || 
                              (localStorage.getItem("termsAccepted") === "true" && localStorage.getItem("termsVersion") === TERMS_VERSION);

          if (!hasValidity) {
            console.log("📝 [Auth Hydration] Redirecionando para aceite de termos.");
            setCurrentScreen(Screen.ACCEPT_TERMS);
          }

          // --- LIBERAÇÃO ULTRA-RÁPIDA DA UI ---
          console.log("🎉 [Auth Hydration] Perfil carregado! Liberando interface principal...");
          setAuthStatus('ready'); // 🎉 TUDO PRONTO PARA O USUÁRIO VER O DASHBOARD!

          // --- CARREGAMENTO ASSÍNCRONO EM SEGUNDO PLANO ---
          console.log("📥 [Auth Hydration BG] Carregando dados complementares em background (Ads, Promos, Favoritos, Chat)...");
          
          const loadBackgroundData = async () => {
            try {
              await Promise.allSettled([
                // A. BUSCAS PÚBLICAS (Anúncios)
                realAds.length === 0 
                  ? api.getAds().then(ads => {
                      if (ads) {
                        console.log(`✅ [Auth Hydration BG] ${ads.length} anúncios carregados.`);
                        setRealAds(ads);
                      }
                    })
                  : Promise.resolve(),
                
                // B. BUSCAS PRIVADAS COMPLEMENTARES
                api.getMyAds().then(res => res && setMyAds(res)),
                api.getPromotions('dashboard').then(res => res.length > 0 && setDashboardPromotions(res)),
                api.getFavorites().then(res => res && setFavorites(res)),
                api.getUserConversations().then(res => res && setConversations(res)),
                api.getBlockedUserIds().then(res => res && setBlockedByMe(res)),
                api.getWhoBlockedMeIds().then(res => res && setBlockedByOthers(res))
              ]);
            } catch (err) {
              console.error("❌ [Auth Hydration BG] Erro nas buscas em segundo plano:", err);
            } finally {
              console.log("🏁 [Auth Hydration BG] Carregamento completo. Ocultando skeletons.");
              setIsAppReady(true); // 🌟 Remove skeletons e mostra o conteúdo real
            }
          };

          loadBackgroundData();

        } else {
          console.log(`⏳ [Auth Hydration] Perfil ainda não disponível. Tentativa ${retryProfileCount + 1}/5...`);
          if (retryProfileCount < 5) {
            setTimeout(() => setRetryProfileCount(prev => prev + 1), 2000);
            return;
          } else {
            console.warn("⚠️ [Auth Hydration] Perfil não carregou após 5 tentativas. Liberando App com dados limitados.");
            setProfileLoaded(true);
            setAuthStatus('ready');
            setIsAppReady(true);
          }
        }
      } catch (error) {
        console.error("❌ [Auth Hydration] Erro ao buscar dados:", error);
        setIsAppReady(true);
        if (user?.id) {
           console.log("🏁 [Auth Hydration] Finalizando fetchData após erro (Garantia Ready)");
           setAuthStatus('ready');
        }
      } finally {
        clearTimeout(softTimeout);
        isFetchingRef.current = false;
        setLoadingMessage("");
      }
    };

    fetchData();
  }, [user?.id, authStatus, retryProfileCount]);

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
    authInitialized,
    sessionReady,
    loadingMessage,
    profileLoaded,
    authLoading, setAuthLoading,
    authStatus, // Exporting explicit status
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
    isBlockedBetween,

    // Hardening Sync
    activeLocksRef,
    ENABLE_REALTIME_TURBO_SYNC
  };
};
