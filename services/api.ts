import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdStatus, User, ReportItem, MessageItem, ChatMessage, HighlightPlan } from '../types';
import { debugLogger } from '../utils/DebugLogger';
import { captureError, addBreadcrumb } from './sentry';

// NOTE: These should be in .env
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const MP_PUBLIC_KEY = (import.meta.env.VITE_MP_PUBLIC_KEY || '').trim();

// Safe initialization
const isValidUrl = (url: string) => {
    try { return !!new URL(url); } catch (e) { return false; }
};

const finalUrl = isValidUrl(SUPABASE_URL) ? SUPABASE_URL : 'https://placeholder-url.supabase.co';

export const supabase: SupabaseClient = createClient(finalUrl, SUPABASE_ANON_KEY, {
    auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// [FLAG MIGRATÓRIA FASE 1] Ativa o uso das novas rotas otimizadas
export const USE_NEW_API = false;

/**
 * API Service Objects Interfaces
 */
export interface CreateAdPayload {
    title: string;
    description: string;
    price: number;
    category: string;
    image: string;
    location: string;
    [key: string]: any;
}

const cleanString = (val: any) => {
    if (!val) return '';
    return String(val).replace(/["']/g, '').trim();
};

/**
 * Centralized Status Mapping
 * Database (values in Portuguese as per current schema) <-> Frontend Enums
 */
export const STATUS_DB_MAP = {
    [AdStatus.ACTIVE]: 'active',
    [AdStatus.PENDING]: 'pending',
    [AdStatus.REJECTED]: 'rejected',
    [AdStatus.SOLD]: 'sold',
    [AdStatus.INACTIVE]: 'paused',
    [AdStatus.BOUGHT]: 'bought',
    [AdStatus.EXPIRED]: 'expired'
};

const DB_STATUS_TO_ADSTATUS: Record<string, AdStatus> = {
    'active': AdStatus.ACTIVE,
    'ativo': AdStatus.ACTIVE,
    'pending': AdStatus.PENDING,
    'pendente': AdStatus.PENDING,
    'rejected': AdStatus.REJECTED,
    'rejeitado': AdStatus.REJECTED,
    'sold': AdStatus.SOLD,
    'vendido': AdStatus.SOLD,
    'paused': AdStatus.INACTIVE,
    'pausado': AdStatus.INACTIVE,
    'inativo': AdStatus.INACTIVE,
    'archived': AdStatus.INACTIVE, // UI mapping for archived
    'arquivado': AdStatus.INACTIVE,
    'bought': AdStatus.BOUGHT,
    'comprado': AdStatus.BOUGHT,
    'expired': AdStatus.EXPIRED,
    'expirado': AdStatus.EXPIRED
};

/**
 * Normaliza o nome do plano vindo do banco (UUIDs ou nomes legados)
 * para os nomes oficiais exigidos: Topo, Premium, Simples.
 */
const normalizeBoostPlan = (plan: string): string => {
    if (!plan) return 'gratis';
    const p = plan.toLowerCase().trim();

    // Mapeamento de UUIDs oficiais (Confirmado via banco de dados)
    if (p === 'f174fc27-88a8-4ac4-a26f-2cd0b8b81cd9') return 'Simples';
    if (p === '90c61495-d664-464c-92f6-8c489a695283') return 'Premium';
    if (p === '072d6be5-4e77-4c75-9ad5-2df2f3cf562b') return 'Topo';

    // Mapeamento de termos legados
    if (p === 'advanced' || p === 'premium' || p === 'turbo máx' || p === 'turbo max') return 'Premium';
    if (p === 'basic' || p === 'simples' || p === 'turbo ágil' || p === 'turbo agil' || p === 'classic' || p === 'turbo') return 'Simples';
    if (p === 'top' || p === 'topo') return 'Topo';
    if (p === 'none' || p === 'gratis' || p === 'grátis' || p === '') return 'gratis';

    // Se for um UUID não mapeado ou valor desconhecido, tenta capitalizar o primeiro caractere
    // para manter a consistência estética se for um nome legível
    return plan.charAt(0).toUpperCase() + plan.slice(1);
};

/**
 * Recursively removes sensitive or non-database fields from payloads
 */
const sanitizePayload = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizePayload);

    const forbidden = ['thumbnail_url', 'isFeatured', 'boost_plan', 'boostPlan', 'boostConfig', 'ownerName', 'ownerAvatar', 'isOwner', 'media', 'images_preview'];
    const newObj: any = {};
    
    for (const key in obj) {
        if (!forbidden.includes(key)) {
            newObj[key] = sanitizePayload(obj[key]);
        }
    }
    return newObj;
};

/**
 * Helper to map DB record (PT) to Item (EN) and clean strings
 */
const mapAdData = (ad: any, isOwner: boolean = false) => {
    // Determine mapped status using centralized logic
    const dbStatus = cleanString(ad.status).toLowerCase();
    const mappedStatus = DB_STATUS_TO_ADSTATUS[dbStatus] || AdStatus.PENDING;

    const category = cleanString(ad.categoria || ad.category);
    
    // --- Safe Parse Detalhes (Fase 3.1) ---
    const detailsRaw = ad.detalhes;
    let detalhes: any = {};
    if (typeof detailsRaw === 'string') {
        try { detalhes = JSON.parse(detailsRaw); } catch(e) { detalhes = {}; }
    } else {
        detalhes = detailsRaw || {};
    }

    // --- Normalização Robusta de Mídia (Fase 3) ---
    // 1. Coleta fontes possíveis: ad.imagens (coluna DB) ou detalhes.images (JSONB)
    const rawImagesSources = [
        ad.imagens,
        detalhes.images,
        detalhes.media,
        ad.image ? [ad.image] : []
    ];

    // LOG DE DEBUG (TEMPORÁRIO) - Estrutura completa para auditoria
    console.log('IMAGEM DEBUG:', { 
        id: ad.id, 
        details_images: detalhes.images, 
        imagens: ad.imagens,
        thumbnail_col: ad.thumbnail_url 
    });

    let combinedRaw: any[] = [];
    for (const source of rawImagesSources) {
        let sourceArr = source;
        if (typeof source === 'string' && source.trim().startsWith('[')) {
            try { sourceArr = JSON.parse(source); } catch (e) { sourceArr = source; }
        }
        
        if (Array.isArray(sourceArr) && sourceArr.length > 0) {
            combinedRaw = sourceArr;
            break; 
        }
    }

    // 2. Normaliza para estrutura AdImage[]
    const normalizedMedia: AdImage[] = combinedRaw.map(item => {
        // Correção crítica: Se for string, pode ser um JSON stringified (ex: na coluna imagens text[])
        if (typeof item === 'string') {
            try {
                const parsed = JSON.parse(item);
                if (parsed && typeof parsed === 'object') {
                    item = parsed; // Substitui pela versão objeto
                }
            } catch (e) {
                // Não é JSON, continua como string normal (URL)
            }
        }

        if (typeof item === 'string') {
            return {
                original: item,
                optimized: item,
                thumbnail: item
            };
        }
        if (item && typeof item === 'object') {
            return {
                original: item.original || item.optimized || item.thumbnail || '',
                optimized: item.optimized || item.original || item.thumbnail || '',
                thumbnail: item.thumbnail || item.optimized || item.original || ''
            };
        }
        return null;
    }).filter(Boolean) as AdImage[];

    const images: string[] = normalizedMedia.map(m => m.optimized);

    // 3. Shortcut Thumbnail (Capas) - Derivado, nunca do Banco
    const thumbnail_url = normalizedMedia[0]?.thumbnail || null;

    const baseData = {
        id: ad.id,
        title: cleanString(ad.titulo || ad.title) || 'Sem título',
        description: cleanString(ad.descricao || ad.descrição || ad.description),
        price: Number(ad.preco || ad.price || 0),
        category: category || 'outros',
        image: normalizedMedia[0]?.optimized || 'https://placehold.co/600x400?text=Sem+Foto',
        images: images,
        media: normalizedMedia, // Novo campo estruturado para o frontend
        thumbnail_url: thumbnail_url, // Shortcut para listas (CAMPO DERIVADO)
        location: cleanString(ad.localizacao || ad.location) || 'Brasil',
        status: mappedStatus,
        boostPlan: normalizeBoostPlan(cleanString(ad.boost_plan || ad.boostPlan)),
        createdAt: ad.created_at || ad.createdAt,
        updatedAt: ad.updated_at || ad.updatedAt,
        userId: ad.user_id || ad.userId,
        ownerName: isOwner ? 'Eu' : (ad.public_profiles?.name || ad.profiles?.name || 'Usuário não disponível'),
        ownerAvatar: ad.public_profiles?.avatar_url || ad.profiles?.avatar_url || null,
        additionalInfo: detalhes.additionalInfo || ad.additionalInfo || [],
        isOwner: isOwner,
        isInFair: ad.is_in_fair || false,
        turbo_expires_at: ad.turbo_expires_at,
        last_turbo_at: ad.last_turbo_at,
        detalhes: detalhes
    };

    if (category === 'imoveis') {
        return {
            ...baseData,
            realEstateType: detalhes.realEstateType || ad.realEstateType,
            transactionType: detalhes.transactionType || ad.transactionType,
            area: detalhes.area || ad.area,
            builtArea: detalhes.builtArea || ad.builtArea,
            bedrooms: detalhes.bedrooms || ad.bedrooms,
            bathrooms: detalhes.bathrooms || ad.bathrooms,
            parking: detalhes.parking || ad.parking,
            features: detalhes.features || ad.features || []
        };
    }

    if (category === 'veiculos' || category === 'autos') {
        let brand = detalhes.brandName || ad.brand;
        let model = detalhes.modelName || ad.model;
        const vehicleType = detalhes.vehicleType || ad.vehicleType;
        const title = baseData.title;

        // Fallback: Tenta extrair do título ou vehicleType se estiver vazio (Anúncios antigos)
        if (!brand && (title || vehicleType)) {
            const source = title || vehicleType;
            brand = source.split(' ')[0];
        }
        if (!model && (title || vehicleType)) {
            const source = title || vehicleType;
            model = source.split(' ').slice(1, 3).join(' ');
        }

        return {
            ...baseData,
            vehicleType,
            brand,
            model,
            year: detalhes.year || ad.year || new Date().getFullYear(),
            mileage: detalhes.mileage || ad.mileage || 0,
            fipePrice: detalhes.fipePrice || ad.fipePrice || 0,
            fuel: detalhes.fuel || ad.fuel,
            gearbox: detalhes.gearbox || ad.gearbox,
            plate: detalhes.plate || ad.plate,
            engine: detalhes.engine || ad.engine,
            features: detalhes.features || ad.features || []
        };
    }

    if (category === 'servicos' || category === 'pecas') {
        return {
            ...baseData,
            partType: detalhes.partType || ad.partType,
            condition: detalhes.condition || ad.condition
        };
    }

    // Default for others
    return {
        ...baseData,
        ...detalhes
    };
};

export const api = {
    /**
     * Report an event to the security monitor (Non-blocking)
     */
    reportSecurityEvent: async (event_type: string, severity: string = 'low', metadata?: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Call the logging Edge Function WITHOUT waiting for it (fire and forget)
            supabase.functions.invoke('log_security_event', {
                body: {
                    event_type,
                    severity,
                    user_id: user?.id,
                    metadata: {
                        window_location: window.location.href,
                        ...metadata
                    }
                }
            }).catch(e => console.warn("[api.reportSecurityEvent] Failed to send log:", e));
        } catch (e) {
            // Silently fail to not break the app
        }
    },

    /**
     * Fetch recent security logs (Admin only)
     */
    getSecurityLogs: async () => {
        return await api.safeRequest(async (token) => {
            const { data, error } = await supabase
                .from('security_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return data || [];
        });
    },

    /**
     * Clear all security logs (Admin only)
     */
    clearSecurityLogs: async () => {
        return await api.safeRequest(async (token) => {
            const { data, error } = await supabase.functions.invoke('admin_clear_logs', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (error) throw error;
            return data;
        });
    },

    /**
     * Get validated access token, refreshing if needed.
     */
    getAuthToken: async (): Promise<string | null> => {
        let { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
            console.log("[api.getAuthToken] No active session, attempting refresh...");
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshed.session) return null;
            session = refreshed.session;
        }

        console.log("[api.getAuthToken] Returning valid access token");
        return session.access_token;
    },

    /**
     * Obtém um token válido e atualizado (Helper centralizado)
     */
    getValidToken: async (): Promise<string> => {
        let { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('Usuário não autenticado');
        }

        // Verifica se está expirado ou prestes a expirar (menos de 1 min)
        const expiresAt = (session.expires_at || 0) * 1000;
        const now = Date.now();

        if (expiresAt - now < 60000) {
            debugLogger.log('♻️ TOKEN PRESTES A EXPIRAR, REFRESHING...');
            const { data, error } = await supabase.auth.refreshSession();

            if (error || !data.session) {
                throw new Error('Falha ao atualizar sessão');
            }

            session = data.session;
            debugLogger.log('♻️ TOKEN REFRESH OK');
        }

        debugLogger.log('🔑 TOKEN OK (VALIDADO)');
        debugLogger.log(`🔐 TOKEN SIZE: ${session.access_token.length}`);

        return session.access_token;
    },

    /**
     * Refresh the current session manually.
     */
    refreshSession: async () => {
        console.log("[api.refreshSession] Manually refreshing session...");
        return await supabase.auth.refreshSession();
    },

    /**
     * Generic wrapper to handle JWT/401 errors and retry once.
     *
     * Ordem correta (auditada):
     *   1. Tenta a requisição com o token atual
     *   2. Se 401/JWT → tenta refresh SILENCIOSO (sem logar no Sentry)
     *   3. Se refresh falhou → ENTÃO loga no Sentry
     *   4. Se refresh OK → retry com token novo
     *   5. Se retry falhou → loga no Sentry
     */
    safeRequest: async <T>(fn: (token: string) => Promise<T>, _endpoint?: string): Promise<T> => {
        const token = await api.getAuthToken();
        if (!token) {
            // ⏳ Tenta refresh antes de desistir
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshed.session) {
                // 🚨 Sentry APENAS se o refresh também falhou — não é ruído de JWT expirado normal
                captureError(new Error('safeRequest: NOT_AUTHENTICATED (refresh falhou)'), {
                    tags: { flow: 'auth', endpoint: _endpoint || 'unknown', type: 'no_session_after_refresh' },
                    level: 'warning',
                });
                throw new Error('NOT_AUTHENTICATED');
            }
            // Refresh funcionou — continua com o token novo
            try {
                return await fn(refreshed.session.access_token);
            } catch (retryError: any) {
                captureError(retryError, {
                    tags: { flow: 'auth', endpoint: _endpoint || 'unknown', type: 'retry_after_cold_refresh_failed' },
                    level: 'error',
                });
                throw retryError;
            }
        }

        try {
            console.log("[api.safeRequest] Executing initial request...");
            return await fn(token);
        } catch (error: any) {
            const errorStr = String(error?.message || error);
            const isAuthError = error?.status === 401 ||
                               errorStr.includes('JWT') ||
                               errorStr.includes('invalid_token') ||
                               errorStr.includes('JWT_EXPIRED');

            if (isAuthError) {
                console.warn("[api.safeRequest] Auth error detected, refreshing and retrying once...");
                // ⏳ FASE 1: Tentativa de refresh silenciosa — NÃO loga no Sentry ainda
                const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();

                if (refreshError || !refreshed.session) {
                    console.error("[api.safeRequest] Refresh failed:", refreshError);
                    // 🚨 FASE 2: Sentry só agora — refresh também falhou
                    captureError(refreshError || new Error('JWT refresh failed'), {
                        tags: {
                            flow: 'auth',
                            type: 'jwt_refresh_failed',
                            endpoint: _endpoint || 'unknown',
                        },
                        level: 'error',
                    });
                    throw error;
                }

                console.log("[api.safeRequest] Retrying with fresh token...");
                // Retry com token novo — se falhar novamente, propaga e cai no catch abaixo
                try {
                    return await fn(refreshed.session.access_token);
                } catch (retryError: any) {
                    // 🚨 Retry também falhou — log definitivo
                    captureError(retryError, {
                        tags: {
                            flow: 'auth',
                            type: 'retry_after_refresh_failed',
                            endpoint: _endpoint || 'unknown',
                        },
                        level: 'error',
                    });
                    throw retryError;
                }
            }

            // Monitoramento de 403 (Acesso Negado)
            if (error?.status === 403) {
                api.reportSecurityEvent('UNAUTHORIZED_ACCESS', 'medium', { reason: '403 Forbidden', message: error.message });
                captureError(error, {
                    tags: { flow: 'security', status_code: '403', endpoint: _endpoint || 'unknown' },
                    level: 'warning',
                });
            }

            // 🚨 Erro inesperado (500, DB, etc.)
            if (error?.status >= 500 || error?.code?.startsWith('PG')) {
                captureError(error, {
                    tags: {
                        flow: 'api',
                        status_code: String(error?.status || 'DB_ERROR'),
                        endpoint: _endpoint || 'unknown',
                    },
                    level: 'error',
                    extra: { error_code: error?.code, message: error?.message },
                });
            }

            throw error;
        }
    },

    /**
     * Create Ad via Edge Function (Secured Limit Check)
     * Falls back to direct insert if Edge Function is not deployed
     */
    createAd: async (adData: CreateAdPayload) => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) throw new Error('User not authenticated');

        // Identify category
        const category = adData.category === 'autos' ? 'veiculos' : adData.category;

        // Build specialized details object
        let details: any = {
            features: adData.features || [],
            additionalInfo: adData.additionalInfo || []
        };

        if (category === 'imoveis') {
            details = {
                ...details,
                realEstateType: adData.realEstateType,
                transactionType: adData.transactionType || 'sale',
                area: adData.area,
                builtArea: adData.builtArea,
                bedrooms: adData.bedrooms,
                bathrooms: adData.bathrooms,
                parking: adData.parking
            };
        } else if (category === 'veiculos') {
            details = {
                ...details,
                year: adData.year,
                mileage: adData.mileage,
                vehicleType: adData.vehicleType,
                fuel: adData.fuel,
                gearbox: adData.gearbox,
                color: adData.color ? adData.color.toLowerCase() : null,
                steering: adData.steering ? adData.steering.toLowerCase() : null,
                doors: adData.doors ? Number(adData.doors) : null,
                plate: adData.plate,
                fipePrice: adData.fipePrice,
                brandName: adData.brandName,
                modelName: adData.modelName, engine: adData.engine
            };
        } else if (category === 'servicos' || category === 'pecas') {
            details = {
                ...details,
                partType: adData.partType,
                condition: adData.condition
            };
        }

        // --- Persistência de Imagens em Detalhes (Fase 3) ---
        // Garantimos que detalhes.images contenha a mídia estruturada
        const mediaStructured = (adData.media && adData.media.length > 0) ? adData.media : [];
        details.images = mediaStructured;

        // Build the payload for the Edge Function
        const edgePayload = sanitizePayload({
            ...adData,
            imagens: mediaStructured.length > 0 ? mediaStructured : (adData.images || []),
            category,
            detalhes: details,
        });

        const { data, error } = await supabase.functions.invoke('create_ad', {
            body: edgePayload
        });

        if (error) {
            console.error('Edge Function failed:', error);
            // Parse network/edge error gracefully
            throw error;
        }

        return mapAdData(data, true);
    },

    /**
     * Generate Checkout Link
     */
    createPreference: async (planId: string, price: number, title: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase.functions.invoke('create_preference', {
            body: { planId, price, title, user_id: user.id }
        });

        if (error) throw error;
        return data; // { init_point: '...' }
    },

    /**
     * Get Current User Profile (Synced with DB)
     */
    getProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            // PGRST116: JSON object requested, multiple (or no) rows returned
            // This happens when the Profile Trigger hasn't finished running yet.
            // We return NULL gracefully so the UI uses auth.user metadata as a fallback.
            if (error.code === 'PGRST116') {
                console.log("ℹ️ Perfil ainda não criado pelo Trigger (Async Race Condition). Usando fallback...");
                return null;
            }

            console.error("❌ Erro no getProfile:", error);
            return null;
        }

        // SAFETY CHECK: Never trust the frontend to dictate admin status if it was somehow passed incorrectly.
        // We only read what is in the database.
        console.log("👤 Perfil carregado do DB:", {
            id: data.id,
            show_online_status: data.show_online_status,
            read_receipts: data.read_receipts
        });

        // Map database fields to User interface
        return {
            id: data.id,
            email: data.email,
            name: data.name || 'Usuário',
            avatarUrl: data.avatar_url || `https://ui-avatars.com/api/?name=${data.email}&background=random`,
            avatar_id: data.avatar_id,
            balance: data.balance || 0,
            activePlan: data.active_plan || 'free',
            isAdmin: data.role === 'admin' || data.is_admin || false,
            role: data.role || 'user',
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || '',
            joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '',
            showOnlineStatus: data.show_online_status ?? true,
            readReceipts: data.read_receipts ?? true,
            lastActiveAt: data.last_active_at,
            acceptedTerms: data.terms_accepted || false,
            acceptedAt: data.terms_accepted_at,
            termsAccepted: data.terms_accepted || false,
            termsAcceptedAt: data.terms_accepted_at,
            termsVersion: data.terms_version,
            cep: data.cep || '',
            deletedAt: data.deleted_at
        };
    },

    /**
     * Polling para aguardar a criação e consistência do perfil após registro.
     * Retorna apenas quando o perfil existe E o flag de termos está ativo.
     * Lança erro se o limite de tentativas for atingido.
     */
    pollForProfile: async (maxRetries = 10): Promise<any> => {
        console.log(`🔍 [Polling] Iniciando busca por perfil persistido (Máx ${maxRetries} tentativas)...`);
        
        for (let i = 0; i < maxRetries; i++) {
            const profile = await api.getProfile();
            
            // Sucesso: Perfil existe e já reflete o aceite de termos
            if (profile && profile.acceptedTerms) {
                console.log("✅ [Polling] Perfil validado e consistente no DB.");
                return profile;
            }
            
            console.log(`⏳ [Polling] Tentativa ${i + 1}/${maxRetries} - Perfil não encontrado ou incompleto...`);
            await new Promise(res => setTimeout(res, 1500));
        }

        console.error("❌ [Polling] Limite de tentativas atingido sem sucesso.");
        throw new Error('PROFILE_NOT_READY');
    },

    /**
     * Update Terms Acceptance Status
     */
    updateTermsAcceptance: async (version: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.id) {
            console.error("❌ Erro: Tentativa de aceite sem user.id");
            throw new Error('User not authenticated');
        }

        console.log("💾 Registrando aceite para:", user.id, "Versão:", version);

        const { error } = await supabase
            .from('profiles')
            .update({
                terms_accepted: true,
                terms_accepted_at: new Date().toISOString(),
                terms_version: version
            })
            .eq('id', user.id);

        if (error) {
            console.error("❌ Erro ao atualizar aceite de termos no DB:", error);
            throw error;
        }

        console.log("✅ Aceite de termos registrado no DB");
        return true;
    },

    /**
     * Get available highlight plans
     */
    getHighlightPlans: async (): Promise<HighlightPlan[]> => {
        const { data, error } = await supabase
            .from('highlight_plans')
            .select('*')
            .eq('active', true)
            .order('priority_level', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Process Highlight Payment (Mercado Pago Brick)
     */
    processHighlightPayment: async (adId: string, planId: string, paymentData: any) => {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            console.error('[API] Session error:', sessionError);
            throw new Error('Session expired. Please login again.');
        }

        console.log('[API] Processing payment with active session');
        console.log('[API] User ID:', session.user.id);
        console.log('[API] Token expires at:', new Date(session.expires_at! * 1000).toLocaleString());
        console.log('[API] Access token preview:', session.access_token ? `${session.access_token.substring(0, 20)}...` : 'none');
        console.log('[API] Token length:', session.access_token?.length);

        // MANUALLY pass the Authorization header is no longer needed if we disable verify_jwt in config.toml
        // and let supabase-js handle the session.
        const { data, error } = await supabase.functions.invoke('create-highlight-payment', {
            body: {
                ad_id: adId,
                plan_id: planId,
                device_id: paymentData.device_id,
                payment_data: paymentData
            }
        });


        if (error) {
            console.error('[API] Edge Function Error:', error);
            throw error;
        }
        return data; // Result from MP API
    },

    /**
     * Get MP Public Key
     */
    getMPPublicKey: () => MP_PUBLIC_KEY,

    /**
     * Update Privacy Settings
     */
    updatePrivacySettings: async (settings: { showOnlineStatus?: boolean, readReceipts?: boolean }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const updateData: any = {};
        if (settings.showOnlineStatus !== undefined) updateData.show_online_status = settings.showOnlineStatus;
        if (settings.readReceipts !== undefined) updateData.read_receipts = settings.readReceipts;

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (error) {
            console.error("❌ Erro ao atualizar privacidade no DB:", error);
            throw error;
        }

        console.log("✅ Privacidade atualizada com sucesso no DB:", updateData);
    },

    /**
     * Update User Profile
     */
    updateProfile: async (userData: Partial<User>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        // Somente envia se o valor existir para evitar conflitos de tipos ou colunas faltantes
        if (userData.name !== undefined) updateData.name = userData.name;
        if (userData.avatarUrl !== undefined) updateData.avatar_url = userData.avatarUrl;
        if (userData.phone !== undefined) updateData.phone = userData.phone;
        if (userData.location !== undefined) updateData.location = userData.location;
        if (userData.bio !== undefined) updateData.bio = userData.bio;
        if (userData.cep !== undefined) updateData.cep = userData.cep;
        if (userData.avatar_id !== undefined) updateData.avatar_id = userData.avatar_id;

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (error) {
            console.error("❌ Erro ao atualizar perfil no DB:", error);
            throw error;
        }

        console.log("✅ Perfil atualizado com sucesso no DB");
        return true;
    },

    /**
     * Get Single Ad by ID (With Timeout and Cache)
     */
    getAdById: async (adId: string, timeoutMs: number = 8000) => {
        // 1. Check Session Cache
        const cacheKey = `orca_ad_cache_${adId}`;
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                console.log("🚀 [API] Returning cached ad for ID:", adId);
                return JSON.parse(cached);
            }
        } catch (e) { /* Ignore cache errors */ }

        // 2. Fetch with Timeout
        const fetchPromise = (async () => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data: ad, error } = await supabase
                .from('anuncios')
                .select(`
                    id, 
                    titulo, 
                    descricao, 
                    preco, 
                    categoria, 
                    imagens, 
                    localizacao, 
                    status, 
                    boost_plan, 
                    created_at, 
                    updated_at, 
                    user_id, 
                    detalhes, 
                    is_in_fair, 
                    turbo_expires_at, 
                    last_turbo_at,
                    public_profiles!user_id(id, name, avatar_url),
                    destaques_anuncios(
                        plano_id,
                        result_ends_at:fim_em,
                        status
                    )
                `)
                .eq('id', adId)
                .single();

            if (error) throw error;
            if (!ad) throw new Error('AD_NOT_FOUND');

            // Security: If not owner and not active, hide it
            const isPublicAccess = ad.user_id !== user?.id;
            const status = String(ad.status).toLowerCase();
            const isActive = status === 'active' || status === 'ativo';

            if (isPublicAccess && !isActive) {
                throw new Error('AD_INACTIVE');
            }

            // Check for active highlight
            const activeHighlight = ad.destaques_anuncios?.find((h: any) =>
                h.status === 'active' && new Date(h.result_ends_at) > new Date()
            );

            if (activeHighlight) {
                ad.detalhes = {
                    ...ad.detalhes,
                    boostConfig: {
                        expiresAt: activeHighlight.result_ends_at,
                        startDate: new Date().toISOString(),
                        totalBumps: 0,
                        bumpsRemaining: 0
                    }
                };
            }

            const mappedAd = mapAdData(ad, ad.user_id === user?.id);

            // 3. Save to Session Cache (10 min expiry logic simplified)
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(mappedAd));
            } catch (e) { /* Ignore cache errors */ }

            return mappedAd;
        })();

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT_ERROR')), timeoutMs);
        });

        return Promise.race([fetchPromise, timeoutPromise]) as Promise<any>;
    },

    /**
     * Get Favorites
     */
    getFavorites: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('favorites')
            .select(`
                ad_id, 
                anuncios:ad_id(
                    id, 
                    titulo, 
                    preco, 
                    categoria, 
                    imagens, 
                    localizacao, 
                    status, 
                    boost_plan, 
                    created_at, 
                    detalhes, 
                    user_id,
                    public_profiles!user_id(name, avatar_url)
                )
            `)
            .eq('user_id', user.id);

        if (error) {
            console.error("❌ Erro ao buscar favoritos:", error);
            return [];
        }

        return (data || [])
            .filter((f: any) => f.anuncios)
            .map((f: any) => mapAdData(f.anuncios, f.anuncios.user_id === user.id));
    },

    /**
     * Add to Favorites
     */
    addFavorite: async (adId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase
            .from('favorites')
            .upsert({ user_id: user.id, ad_id: adId }); // Usa upsert para evitar 409 de duplicata

        if (error) {
            console.error("❌ Erro detalhado no addFavorite:", {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });

            if (error.code === '23503') {
                throw new Error('Erro de Banco: A tabela favorites ainda aponta para ads em vez de anuncios. Por favor, rode o script de correção SQL.');
            }
            throw error;
        }
    },

    /**
     * Remove from Favorites
     */
    removeFavorite: async (adId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('ad_id', adId);

        if (error) {
            console.error("❌ Erro detalhado no removeFavorite:", error);
            throw error;
        }
    },


    /**
     * ADMIN: Get all users from the platform
     * Restricted by RLS
     */
    getAllUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase
            .from('public_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return (data || []).map(p => ({
            id: p.id,
            email: p.email,
            name: p.name || 'Usuário',
            avatarUrl: p.avatar_url || `https://ui-avatars.com/api/?name=${p.email}&background=random`,
            balance: p.balance || 0,
            activePlan: p.active_plan || 'free',
            isAdmin: p.is_admin || false,
            isBlocked: p.is_blocked || false,
            phone: p.phone || '',
            location: p.location || '',
            bio: p.bio || '',
            joinDate: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '',
            lastActiveAt: p.last_active_at
        }));
    },

    /**
     * ADMIN: Toggle User Block Status
     * Requires Admin RLS or Edge Function
     */
    toggleUserBlock: async (userId: string, isBlocked: boolean) => {
        // PER MANDATE: All sensitive user updates must be via Edge Functions
        const { data, error } = await supabase.functions.invoke('admin_manage_users', {
            body: { action: 'toggle_block', userId, status: isBlocked }
        });

        console.log("Edge Function (toggle_block) Result:", { data, error });

        if (error) throw error;
        return true;
    },

    /**
     * ADMIN: Deletar Anúncio Permanentemente (Via Edge Function)
     */
    adminDeleteAd: async (adId: string, reportId?: string) => {
        const { data, error } = await supabase.functions.invoke('admin_manage_reports', {
            body: { action: 'delete_ad', adId, reportId }
        });

        if (error) throw error;
        return data; // Returns { success: true, deletedCount: N }
    },

    /**
     * ADMIN: Delete User (Strict)
     */
    deleteUser: async (userId: string) => {
        const { data, error } = await supabase.functions.invoke('admin_manage_users', {
            body: { action: 'delete', userId }
        });

        console.log("Edge Function (delete) Result:", { data, error });

        if (error) throw error;
        return true;
    },

    /**
     * Update Single Ad (Owner only - RLS)
     * Security Hardening: Forces status to 'pendente' and ignores it from payload.
     */
    updateAd: async (adId: string, adData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // Identify category
        const category = adData.category === 'autos' ? 'veiculos' : adData.category;

        // Build specialized details object (similar to createAd)
        let details: any = {
            features: adData.features || [],
            additionalInfo: adData.additionalInfo || []
        };

        if (category === 'imoveis') {
            details = {
                ...details,
                realEstateType: adData.realEstateType,
                transactionType: adData.transactionType || 'sale',
                area: adData.area,
                builtArea: adData.builtArea,
                bedrooms: adData.bedrooms,
                bathrooms: adData.bathrooms,
                parking: adData.parking
            };
        } else if (category === 'veiculos') {
            details = {
                ...details,
                year: adData.year,
                mileage: adData.mileage,
                vehicleType: adData.vehicleType,
                fuel: adData.fuel,
                gearbox: adData.gearbox,
                color: adData.color ? adData.color.toLowerCase() : null,
                steering: adData.steering ? adData.steering.toLowerCase() : null,
                doors: adData.doors ? Number(adData.doors) : null,
                plate: adData.plate,
                fipePrice: adData.fipePrice,
                brandName: adData.brandName,
                modelName: adData.modelName, engine: adData.engine
            };
        } else if (category === 'servicos' || category === 'pecas') {
            details = {
                ...details,
                partType: adData.partType,
                condition: adData.condition
            };
        }

        // --- Persistência de Imagens em Detalhes (Fase 3) ---
        const mediaStructured = (adData.media && adData.media.length > 0) ? adData.media : [];
        details.images = mediaStructured;

        // 1. Prepare and sanitize update payload
        const updatePayload = sanitizePayload({
            titulo: adData.title,
            descricao: adData.description,
            preco: adData.price,
            categoria: category,
            imagens: mediaStructured.length > 0 ? mediaStructured : (adData.images || []),
            localizacao: adData.location,
            detalhes: details,
            updated_at: new Date().toISOString(),
            status: 'pending' // Force re-moderation on edit
        });

        // 3. HARDENING: Blindagem Global contra alteração de campos de Destaque/Turbo
        // Estes campos são protegidos por trigger no banco, mas aqui evitamos até a tentativa de envio.
        const FORBIDDEN_FIELDS = [
            'turbo_expires_at',
            'turbo_score',
            'turbo_type',
            'is_turbo',
            'turbo_weight',
            'turbo_progress',
            'boost_plan',
            'boost_plan_id' // Adicional
        ];

        FORBIDDEN_FIELDS.forEach(field => {
            if (field in updatePayload) {
                delete updatePayload[field];
            }
        });

        console.log("[EDIT] Payload sanitizado enviado");

        const { error } = await supabase
            .from('anuncios')
            .update(updatePayload)
            .eq('id', adId)
            .eq('user_id', user.id);

        if (error) {
            console.error("❌ Erro ao atualizar anúncio:", error);
            throw error;
        }
        return true;
    },

    /**
     * Legacy/Small Updates (Owner only - RLS)
     * e.g. updating is_in_fair status
     */
    updateAnuncio: async (adId: string, updateData: { is_in_fair?: boolean, [key: string]: any }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { error } = await supabase
            .from('anuncios')
            .update(updateData)
            .eq('id', adId)
            .eq('user_id', user.id);

        if (error) {
            console.error("❌ Erro ao atualizar anuncio (v1):", error);
            throw error;
        }
        return true;
    },

    /**
     * ADMIN: Moderate Ad Status
     */
    adminUpdateAdStatus: async (adId: string, status: AdStatus) => {
        const { error } = await supabase
            .from('anuncios')
            .update({ status: STATUS_DB_MAP[status] || STATUS_DB_MAP[AdStatus.PENDING] })
            .eq('id', adId);

        if (error) throw error;
        return true;
    },

    /**
     * ADMIN: Content Moderation - List Reports
     */
    getReports: async () => {
        const { data, error } = await supabase.functions.invoke('admin_manage_reports', {
            body: { action: 'list' }
        });
        if (error) throw error;
        return data;
    },

    /**
     * ADMIN: Content Moderation - Update Report Status
     */
    updateReportStatus: async (reportId: string, status: 'resolved' | 'dismissed') => {
        const { error } = await supabase.functions.invoke('admin_manage_reports', {
            body: { action: 'update_status', reportId, status }
        });
        if (error) throw error;
        return true;
    },

    /**
     * ADMIN: Content Moderation - Delete Report
     */
    deleteReport: async (reportId: string) => {
        const { error } = await supabase.functions.invoke('admin_manage_reports', {
            body: { action: 'delete', reportId }
        });
        if (error) throw error;
        return true;
    },

    /**
     * Get app average price for comparison
     */
    getAveragePrice: async (category: string, brand: string, model: string, year: number) => {
        const { data, error } = await supabase.rpc('get_app_average_price', {
            p_category: category,
            p_brand: brand,
            p_model: model,
            p_year: year
        });

        if (error) {
            console.error('Error fetching average price:', error);
            return null;
        }

        return data[0] as { average_price: number | null, ad_count: number };
    },

    /**
     * Create a new report via direct DB insert
     */
    createReport: async (reportData: Partial<ReportItem>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { error } = await supabase.from('reports').insert({
            reporter_id: user.id,
            ad_id: reportData.targetType === 'ad' ? (reportData.targetId || reportData.adId) : null,
            target_id: reportData.targetId,
            target_type: reportData.targetType,
            target_name: reportData.targetName,
            target_image: reportData.targetImage,
            reported_user_id: reportData.reportedUserId && reportData.reportedUserId.length === 36 ? reportData.reportedUserId : null,
            reason: reportData.reason,
            description: reportData.description,
            severity: reportData.severity || 'medium',
            status: 'pending',
            metadata: {
                originalReportedUserId: reportData.reportedUserId // Backup for any format
            }
        });

        if (error) {
            console.error("❌ Erro ao inserir denúncia no banco:", error);
            throw error;
        }
        return true;
    },

    /**
     * Get Public Profile of another user
     */
    getPublicProfile: async (userId: string) => {
        if (!userId) return null;

        try {
            const { data, error } = await supabase
                .from('public_profiles')
                .select('id, name, avatar_url, bio, location, created_at')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Map to User type
            return {
                id: data.id,
                name: data.name || 'Vendedor',
                avatarUrl: data.avatar_url || null,
                location: data.location || 'Brasil',
                bio: data.bio || 'Usuário do Feirão da Orca',
                joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '',
                lastActiveAt: data.last_active_at,
                verified: true,
                email: '', // Don't expose email publicly
                balance: 0,
                adsCount: 0
            } as User;
        } catch (err) {
            console.error('❌ Error fetching public profile:', err);
            return null;
        }
    },

    /**
     * Get All Ads for Admin (Pending, Active, Rejected)
     */
    getAllAdsForAdmin: async () => {
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select('*, public_profiles!user_id(name, avatar_url)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("❌ Admin fetch error:", error);
                throw error;
            }

            return (data || []).map((ad: any) => mapAdData(ad, false));
        } catch (error) {
            console.error("❌ Erro no getAllAdsForAdmin:", error);
            return [];
        }
    },

    /**
     * [NOVA API - FASE 1] Get Ads List com Select Leve e Filtros no servidor
     * Substitui o download massivo pelo carregamento sob demanda.
     */
    getAdsList: async (params: { 
        limit?: number, 
        offset?: number, 
        category?: string, 
        searchTerm?: string,
        filters?: any 
    }) => {
        const { limit = 20, offset = 0, category, searchTerm, filters } = params;
        
        try {
            console.log(`📡 [API NEW] getAdsList: Limit ${limit}, Offset ${offset}, Search: "${searchTerm}"`);
            
            // 1. Base Query com Select Leve (Colunas essenciais para o card)
            let query = supabase
                .from('anuncios')
                .select(`
                    id, 
                    titulo, 
                    preco, 
                    categoria, 
                    imagens, 
                    localizacao, 
                    status, 
                    boost_plan, 
                    created_at, 
                    detalhes, 
                    turbo_expires_at, 
                    last_turbo_at, 
                    is_in_fair, 
                    user_id,
                    public_profiles!user_id(id, name, avatar_url)
                `)
                .eq('status', 'active');

            // 2. Filtros no Servidor (Case Insensitive e Indexados)
            if (category) {
                if (Array.isArray(category)) {
                    query = query.in('categoria', category);
                } else if (category === 'veiculos' || category === 'autos') {
                    query = query.in('categoria', ['veiculos', 'autos']);
                } else {
                    query = query.eq('categoria', category);
                }
            }

            if (searchTerm) {
                // Aproveita o índice de trigrama criado no SQL
                query = query.ilike('titulo', `%${searchTerm}%`);
            }

            // Filtros Avançados (JSONB)
            if (filters?.brand) {
                query = query.filter('detalhes->>brandName', 'eq', filters.brand);
            }
            if (filters?.baseModel) {
                query = query.filter('detalhes->>modelName', 'eq', filters.baseModel);
            }

            // 3. Paginação
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) throw error;
            return (data || []).map((ad: any) => mapAdData(ad));
        } catch (error) {
            console.error('❌ Erro no getAdsList:', error);
            throw error;
        }
    },

    /**
     * [NOVA API - FASE 1] Busca detalhes completos de um anúncio específico
     */
    getAdDetails: async (adId: string) => {
        try {
            console.log(`📡 [API NEW] getAdDetails: ${adId}`);
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    *, 
                    public_profiles!user_id(id, name, avatar_url),
                    destaques_anuncios(
                        plano_id,
                        result_ends_at:fim_em,
                        status
                    )
                `)
                .eq('id', adId)
                .single();

            if (error) throw error;
            return mapAdData(data, false); // ownerName será preenchido pelo UI se necessário
        } catch (error) {
            console.error('❌ Erro no getAdDetails:', error);
            throw error;
        }
    },

    /**
     * [NOVA API - FASE 2] Função Roteadora para facilitar a migração
     */
    fetchAds: async (limit = 50, offset = 0, category?: string, searchTerm?: string, filters?: any) => {
        if (!USE_NEW_API) {
            // Modo antigo: Ignora offset e filtros, baixa tudo (limit alto)
            return await api.getAds(500, 0, category); 
        }
        
        return await api.getAdsList({ limit, offset, category, searchTerm, filters });
    },

    getAds: async (limit = 50, offset = 0, category?: string) => {
        try {
            // USANDO RPC 'get_feed': Centraliza a lógica de Ranking (Turbo + Time Decay).
            // Agora aceita 'category_filter' para que veículos/imóveis também fiquem rankeados.
            const { data, error } = await supabase.rpc('get_feed', {
                limit_count: limit,
                offset_count: offset,
                category_filter: category || null
            });

            if (error) {
                console.error('❌ Erro ao chamar get_feed RPC:', error);
                // Fallback simples caso a function RPC falhe (ex: cache desatualizado)
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('anuncios')
                    .select('*, public_profiles!user_id(name, avatar_url)')
                    .eq('status', STATUS_DB_MAP[AdStatus.ACTIVE])
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (fallbackError) throw fallbackError;
                return fallbackData.map((ad: any) => mapAdData(ad));
            }

            return (data || []).map((ad: any) => {
                // O RPC get_feed já retorna os dados via view ads_ranked que inclui is_turbo_active.
                // Mantemos a lógica de injeção de boostConfig para compatibilidade com a Ribbon do frontend.
                if (ad.is_turbo_active) {
                    ad.detalhes = {
                        ...ad.detalhes,
                        boostConfig: {
                            expiresAt: ad.turbo_expires_at,
                            startDate: ad.created_at, // Opcional
                            totalBumps: 0,
                            bumpsRemaining: 0
                        }
                    };
                }
                return mapAdData(ad);
            });

        } catch (err) {
            console.error('❌ Erro crítico em getAds:', err);
            return [];
        }
    },

    getMyAds: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            // Fetch ads AND active highlights
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    id, 
                    titulo, 
                    descricao, 
                    preco, 
                    categoria, 
                    imagens, 
                    localizacao, 
                    status, 
                    boost_plan, 
                    created_at, 
                    detalhes, 
                    user_id, 
                    is_in_fair, 
                    turbo_expires_at, 
                    last_turbo_at,
                    public_profiles!user_id(name, avatar_url),
                    destaques_anuncios(
                        plano_id,
                        result_ends_at:fim_em,
                        status
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("❌ Error fetching my ads:", error);
                throw error;
            }

            return (data || []).map((ad: any) => {
                // Check for active highlight
                const activeHighlight = ad.destaques_anuncios?.find((h: any) =>
                    h.status === 'active' && new Date(h.result_ends_at) > new Date()
                );

                if (activeHighlight) {
                    // Inject highlight info into the ad object before mapping
                    // We map it to boostConfig as the frontend expects
                    ad.detalhes = {
                        ...ad.detalhes,
                        boostConfig: {
                            expiresAt: activeHighlight.result_ends_at,
                            startDate: new Date().toISOString(), // Approximate or fetch from start_at if added to query
                            totalBumps: 0, // Not tracked in ad_highlights yet
                            bumpsRemaining: 0
                        },
                        // We can also force boost_plan if we want strictly active ones
                        // ad.boost_plan = 'premium' (or map plan_id to name if needed)
                    };
                    // Override boost_plan to ensure UI sees it
                    if (activeHighlight && (!ad.boost_plan || ad.boost_plan === 'gratis')) {
                        // Removido active_highlight
                    }
                }

                // --- NOVO: SUPORTE AO TURBO_EXPIRES_AT (SINGLE SOURCE OF TRUTH) ---
                const isTurboActive = ad.turbo_expires_at && new Date(ad.turbo_expires_at) > new Date();
                if (isTurboActive) {
                    // Sincroniza turbo_expires_at para boostConfig.expiresAt para que o frontend existente funcione
                    ad.detalhes = {
                        ...(ad.detalhes || {}),
                        boostConfig: {
                            expiresAt: ad.turbo_expires_at,
                            startDate: ad.last_turbo_at || ad.created_at,
                            totalBumps: 0,
                            bumpsRemaining: 0
                        }
                    };
                }

                return mapAdData(ad, true);
            });
        } catch (err) {
            console.error('🔥 Critical error in getMyAds:', err);
            return [];
        }
    },

    /**
     * CHAT: Get Histórico de Mensagens
     */
    getChatMessages: async (adId: string, otherUserId: string, limit = 20, offset = 0): Promise<ChatMessage[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        try {
            console.log(`📡 [API NEW] getChatMessages: Ad ${adId}, With ${otherUserId}, Limit ${limit}, Offset ${offset}`);
            
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id, 
                    content, 
                    image_url, 
                    images, 
                    sender_id, 
                    created_at, 
                    is_read
                `)
                .eq('ad_id', adId)
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: false }) // Pegar as mais recentes primeiro
                .range(offset, offset + limit - 1);

            if (error) throw error;

            // Reverte para o chat exibir em ordem cronológica (mais antigas em cima)
            const mapped = (data || []).map(m => ({
                id: m.id,
                text: m.content || '',
                imageUrl: m.image_url,
                images: m.images || [],
                isMine: m.sender_id === user.id,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isRead: m.is_read
            }));

            return mapped.reverse();
        } catch (error) {
            console.error('❌ Erro no getChatMessages:', error);
            throw error;
        }
    },

    /**
     * CHAT: Enviar Mensagem
     */
    sendMessage: async (adId: string, receiverId: string, content: string, images?: string[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    ad_id: adId,
                    sender_id: user.id,
                    receiver_id: receiverId,
                    content: content || "",
                    images: (images && images.length > 0) ? images : null,
                    image_url: (images && images.length > 0) ? images[0] : null
                })
                .select()
                .single();

            if (error) {
                console.error("❌ Supabase error FULL:", JSON.stringify(error, null, 2));
                console.error("❌ message:", error.message);
                console.error("❌ details:", error.details);
                console.error("❌ hint:", error.hint);
                console.error("❌ code:", error.code);
                throw error;
            }

            return data;
        } catch (err: any) {
            console.error("❌ Erro detalhado no sendMessage:", JSON.stringify(err, null, 2));
            throw err;
        }
    },

    /**
     * CHAT: Listar Conversas (Agregação Local)
     */
    getUserConversations: async (): Promise<MessageItem[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Buscamos todas as mensagens onde o usuário participa usando a VIEW pública
        // SEGURANÇA: Não acessamos 'profiles' diretamente para evitar bloqueios de RLS e vazamento de dados.
        const { data, error } = await supabase
            .from('messages')
            .select(`
                id, 
                ad_id, 
                sender_id, 
                receiver_id, 
                content, 
                image_url, 
                created_at, 
                is_read,
                ads:ad_id(id, titulo, imagens, preco), 
                sender:public_profiles!sender_id(id, name, avatar_url), 
                receiver:public_profiles!receiver_id(id, name, avatar_url)
            `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const conversationsMap = new Map<string, MessageItem>();

        (data || []).forEach(m => {
            const isMine = m.sender_id === user.id;
            const otherUser = isMine ? m.receiver : m.sender;
            const otherUserId = isMine ? m.receiver_id : m.sender_id;

            // Chave única por Ad + Outro Usuário
            const key = `${m.ad_id}_${otherUserId}`;

            if (!conversationsMap.has(key)) {
                conversationsMap.set(key, {
                    id: m.id, // ID da última mensagem (UUID único)
                    otherUserId: otherUserId, // ID do outro usuário para o ChatDetail
                    senderName: otherUser?.name || 'Usuário indisponível',
                    avatarUrl: otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherUser?.name || 'U'}`,
                    lastMessage: m.content || (m.image_url ? '📷 Foto' : ''),
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unreadCount: (data || []).filter(msg =>
                        msg.ad_id === m.ad_id &&
                        msg.sender_id === otherUserId &&
                        msg.receiver_id === user.id &&
                        !msg.is_read
                    ).length,
                    adTitle: m.ads?.titulo || 'Anúncio',
                    adId: m.ad_id,
                    adImage: m.ads?.imagens?.[0] || 'https://placehold.co/100x100?text=Orca',
                    adPrice: m.ads?.preco || 0,
                    readReceipts: true, // Fallback safe já que não expoemos este campo na view pública
                    online: false      // Fallback safe já que não expoemos este campo na view pública
                });
            }
        });

        return Array.from(conversationsMap.values());
    },

    /**
     * CHAT: Marcar mensagens como lidas
     */
    markMessagesAsRead: async (adId: string, otherUserId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('ad_id', adId)
            .eq('sender_id', otherUserId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        if (error) {
            console.error("❌ Erro ao marcar mensagens como lidas:", error);
        }
    },

    /**
     * AUTH: Recuperação de Senha
     */
    sendPasswordReset: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}`,
        });
        if (error) throw error;
    },

    /**
     * AUTH: Alterar Senha
     */
    updatePassword: async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    },
    /**
     * AUTH: Exclusão de Conta (Soft Delete)
     */
    requestAccountDeletion: async () => {
        const { error } = await supabase.rpc('request_account_deletion');
        if (error) throw error;
    },

    /**
     * PRIVACY: Bloqueio de Usuários
     */
    blockUser: async (blockedId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // Hardening: Impedir auto-bloqueio no nível de API
        if (user.id === blockedId) {
            console.warn("⚠️ Tentativa de auto-bloqueio bloqueada na API");
            return;
        }

        console.log(`📡 Tentando bloquear usuário: ${blockedId} (por: ${user.id})`);

        const { error } = await supabase
            .from('user_blocks')
            .insert({
                blocker_id: user.id,
                blocked_id: blockedId
            });
        
        if (error) {
            console.error("❌ Erro Supabase ao bloquear:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            
            if (error.code === '23505') return; // Já bloqueado
            throw error;
        }
        console.log("✅ Usuário bloqueado com sucesso no DB");
    },

    unblockUser: async (blockedId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { error } = await supabase
            .from('user_blocks')
            .delete()
            .eq('blocker_id', user.id)
            .eq('blocked_id', blockedId);
        
        if (error) throw error;
    },

    getBlockedUserIds: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('user_blocks')
            .select('blocked_id')
            .eq('blocker_id', user.id);
        
        if (error) {
            console.error("Erro ao buscar bloqueados:", error.message);
            // Fallback para evitar travamentos se a conexão falhar
            if (error.code === 'PGRST116' || error.message.includes('not found')) return [];
            throw error;
        }
        return (data || []).map(b => b.blocked_id);
    },

    getWhoBlockedMeIds: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('user_blocks')
            .select('blocker_id')
            .eq('blocked_id', user.id);
        
        if (error) {
            console.error("Erro ao buscar quem me bloqueou:", error.message);
            if (error.code === 'PGRST116' || error.message.includes('not found')) return [];
            throw error;
        }
        return (data || []).map(b => b.blocker_id);
    },

    getBlockedUsersFull: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('user_blocks')
            .select(`
                blocked_id,
                profiles:blocked_id (
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq('blocker_id', user.id);
        
        if (error) {
            console.error("Erro ao buscar bloqueados (full):", error.message);
            if (error.code === 'PGRST116' || error.message.includes('not found')) return [];
            throw error;
        }
        return (data || []).map((b: any) => ({
            id: b.blocked_id,
            name: b.profiles?.name || 'Usuário Orca',
            avatarUrl: b.profiles?.avatar_url || 'https://via.placeholder.com/100'
        }));
    },

    /**
     * SYSTEM: Gestão Global (Feira e Manutenção)
     */
    getSystemSettings: async () => {
        const { data, error } = await supabase
            .from('system_settings')
            .select('fair_active, maintenance_mode')
            .eq('id', true)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * ADMIN: Fetch statistical report data via secure Edge Function
     */
    getAdminStats: async () => {
        const { data, error } = await supabase.functions.invoke('admin_get_stats');
        if (error) throw error;
        return data; // { totalUsers, activeAds, totalRevenue, plansSold }
    },

    updateSystemSetting: async (settings: { fair_active?: boolean, maintenance_mode?: boolean }) => {
        const { error } = await supabase
            .from('system_settings')
            .update({
                ...settings,
                updated_at: new Date().toISOString()
            })
            .eq('id', true);

        if (error) throw error;
    },

    /**
     * PROMOTIONS: Global Banner Management
     */
    getPromotions: async (category?: string) => {
        let query = supabase
            .from('promotions')
            .select('*')
            .order('order_index', { ascending: true });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            category: p.category,
            title: p.title,
            subtitle: p.subtitle,
            image: p.image,
            link: p.link,
            startDate: p.start_date,
            endDate: p.end_date,
            active: p.active,
            order: p.order_index
        }));
    },

    savePromotion: async (promo: any) => {
        const { id, order, startDate, endDate, ...rest } = promo;

        const payload = {
            ...rest,
            order_index: order,
            start_date: startDate,
            end_date: endDate,
            updated_at: new Date().toISOString()
        };

        if (id && !id.startsWith('promo_')) { // Real UUID from DB
            const { data, error } = await supabase
                .from('promotions')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            // New or Mock promotion being converted
            const { data, error } = await supabase
                .from('promotions')
                .insert({
                    ...payload,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },

    deletePromotion: async (id: string) => {
        const { error } = await supabase
            .from('promotions')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    togglePromotionActive: async (id: string, active: boolean) => {
        const { error } = await supabase
            .from('promotions')
            .update({ active, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};
