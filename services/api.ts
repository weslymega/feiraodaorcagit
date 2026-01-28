import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdStatus, User, ReportItem, MessageItem, ChatMessage } from '../types';

// NOTE: These should be in .env
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Safe initialization
const isValidUrl = (url: string) => {
    try { return !!new URL(url); } catch (e) { return false; }
};

const finalUrl = isValidUrl(SUPABASE_URL) ? SUPABASE_URL : 'https://placeholder-url.supabase.co';

export const supabase: SupabaseClient = createClient(finalUrl, SUPABASE_ANON_KEY);

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
    [AdStatus.ACTIVE]: 'ativo',
    [AdStatus.PENDING]: 'pendente',
    [AdStatus.REJECTED]: 'rejeitado',
    [AdStatus.SOLD]: 'vendido',
    [AdStatus.INACTIVE]: 'inativo',
    [AdStatus.BOUGHT]: 'comprado'
};

const DB_STATUS_TO_ADSTATUS: Record<string, AdStatus> = {
    'ativo': AdStatus.ACTIVE,
    'active': AdStatus.ACTIVE,
    'pendente': AdStatus.PENDING,
    'pending': AdStatus.PENDING,
    'rejeitado': AdStatus.REJECTED,
    'rejected': AdStatus.REJECTED,
    'vendido': AdStatus.SOLD,
    'sold': AdStatus.SOLD,
    'inativo': AdStatus.INACTIVE,
    'inactive': AdStatus.INACTIVE,
    'paused': AdStatus.INACTIVE,
    'comprado': AdStatus.BOUGHT
};

/**
 * Helper to map DB record (PT) to Item (EN) and clean strings
 */
const mapAdData = (ad: any, isOwner: boolean = false) => {
    // Determine mapped status using centralized logic
    const dbStatus = cleanString(ad.status).toLowerCase();
    const mappedStatus = DB_STATUS_TO_ADSTATUS[dbStatus] || AdStatus.PENDING;

    const category = cleanString(ad.categoria || ad.category);
    const detalhes = ad.detalhes || {};

    const baseData = {
        id: ad.id,
        title: cleanString(ad.titulo || ad.title) || 'Sem título',
        description: cleanString(ad.descricao || ad.descrição || ad.description),
        price: Number(ad.preco || ad.price || 0),
        category: category || 'outros',
        image: (ad.imagens?.[0] || ad.image || 'https://placehold.co/600x400?text=Sem+Foto'),
        images: Array.isArray(ad.imagens) ? ad.imagens : (ad.image ? [ad.image] : []),
        location: cleanString(ad.localizacao || ad.location) || 'Brasil',
        status: mappedStatus,
        boostPlan: cleanString(ad.boost_plan || ad.boostPlan) || 'gratis',
        createdAt: ad.created_at || ad.createdAt,
        updatedAt: ad.updated_at || ad.updatedAt,
        userId: ad.user_id || ad.userId,
        ownerName: isOwner ? 'Eu' : (ad.profiles?.name || 'Usuário não encontrado'),
        ownerAvatar: ad.profiles?.avatar_url || null,
        additionalInfo: detalhes.additionalInfo || ad.additionalInfo || [],
        isOwner: isOwner,
        isInFair: ad.is_in_fair || false // Mapeando novo campo do banco
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
        return {
            ...baseData,
            vehicleType: detalhes.vehicleType || ad.vehicleType,
            year: detalhes.year || ad.year || new Date().getFullYear(),
            mileage: detalhes.mileage || ad.mileage || 0,
            fipePrice: detalhes.fipePrice || ad.fipePrice || 0,
            fuel: detalhes.fuel || ad.fuel,
            gearbox: detalhes.gearbox || ad.gearbox,
            plate: detalhes.plate || ad.plate,
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
                color: adData.color,
                plate: adData.plate,
                fipePrice: adData.fipePrice
            };
        } else if (category === 'servicos' || category === 'pecas') {
            details = {
                ...details,
                partType: adData.partType,
                condition: adData.condition
            };
        }

        try {
            // Try Edge Function first (has limit checking)
            // Passing 'detalhes' explicitly so the function can be updated to handle it
            const { data, error } = await supabase.functions.invoke('create_ad', {
                body: {
                    ...adData,
                    category, // normalized
                    detalhes: details
                }
            });

            if (error) {
                console.warn('Edge Function failed, using direct insert:', error.message);
                throw error;
            }

            return mapAdData(data, true);
        } catch (edgeFunctionError) {
            // Fallback: Direct insert to database using strict DB names
            console.log('📝 Usando inserção direta no banco (Edge Function não disponível)');

            const { data: ad, error: insertError } = await supabase
                .from('anuncios')
                .insert({
                    user_id: session.user.id,
                    titulo: adData.title,
                    descricao: adData.description,
                    preco: adData.price,
                    categoria: category,
                    status: STATUS_DB_MAP[AdStatus.PENDING],
                    imagens: adData.images || (adData.image ? [adData.image] : []),
                    localizacao: adData.location,
                    detalhes: details,
                    boost_plan: adData.boostPlan || 'gratis'
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return mapAdData(ad, true);
        }
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
            console.error("❌ Erro no getProfile:", error);
            return null;
        }

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
            balance: data.balance || 0,
            activePlan: data.active_plan || 'free',
            isAdmin: data.is_admin || false,
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || '',
            joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '',
            showOnlineStatus: data.show_online_status ?? true,
            readReceipts: data.read_receipts ?? true
        };
    },

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
     * Get Single Ad by ID
     */
    getAdById: async (adId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: ad, error } = await supabase
            .from('anuncios')
            .select('*, profiles:user_id(name, avatar_url)')
            .eq('id', adId)
            .single();

        if (error) throw error;
        return mapAdData(ad, ad.user_id === user?.id);
    },

    /**
     * Get Favorites
     */
    getFavorites: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('favorites')
            .select('ad_id, anuncios:ad_id(*, profiles:user_id(name, avatar_url))')
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
            .from('profiles')
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
            joinDate: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 'Recente'
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
     * Supports updating is_in_fair status
     */
    updateAnuncio: async (adId: string, updateData: { is_in_fair?: boolean, [key: string]: any }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { error } = await supabase
            .from('anuncios')
            .update(updateData)
            .eq('id', adId)
            .eq('user_id', user.id); // Extra safety, though RLS handles it

        if (error) {
            console.error("❌ Erro ao atualizar anúncio:", error);
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
                .from('profiles')
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
                joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 'Recente',
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
                .select('*, profiles:user_id(name, avatar_url)')
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
     * Get All Active Ads (Feed)
     */
    getAds: async () => {
        try {
            // Fetch only ACTIVE ads for public feed
            // JOIN with profiles to get seller info
            const { data, error } = await supabase
                .from('anuncios')
                .select('*, profiles:user_id(name, avatar_url)')
                .eq('status', STATUS_DB_MAP[AdStatus.ACTIVE])
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('⚠️ JOIN with profiles failed, retrying simple select...');
                const { data: simpleData, error: simpleError } = await supabase
                    .from('anuncios')
                    .select('*')
                    .eq('status', STATUS_DB_MAP[AdStatus.ACTIVE])
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (simpleError) throw simpleError;
                return simpleData.map((ad: any) => mapAdData(ad));
            }

            return (data || []).map((ad: any) => mapAdData(ad));

        } catch (err) {
            console.error('❌ Error in getAds:', err);
            return [];
        }
    },

    getMyAds: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('anuncios')
                .select('*, profiles:user_id(name, avatar_url)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                const { data: simpleData, error: simpleError } = await supabase
                    .from('anuncios')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (simpleError) throw simpleError;
                return simpleData.map((ad: any) => mapAdData(ad, true));
            }

            return (data || []).map((ad: any) => mapAdData(ad, true));
        } catch (err) {
            console.error('🔥 Critical error in getMyAds:', err);
            return [];
        }
    },

    /**
     * CHAT: Get Histórico de Mensagens
     */
    getChatMessages: async (adId: string, otherUserId: string): Promise<ChatMessage[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('ad_id', adId)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(m => ({
            id: m.id,
            text: m.content || '',
            imageUrl: m.image_url,
            isMine: m.sender_id === user.id,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: m.is_read
        }));
    },

    /**
     * CHAT: Enviar Mensagem
     */
    sendMessage: async (adId: string, receiverId: string, content: string, imageUrl?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        const { data, error } = await supabase
            .from('messages')
            .insert({
                ad_id: adId,
                sender_id: user.id,
                receiver_id: receiverId,
                content,
                image_url: imageUrl
            })
            .select()
            .single();

        if (error) {
            console.error("❌ Erro ao enviar mensagem:", error);
            throw error;
        }
        return data;
    },

    /**
     * CHAT: Listar Conversas (Agregação Local)
     */
    getUserConversations: async (): Promise<MessageItem[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Buscamos todas as mensagens onde o usuário participa
        const { data, error } = await supabase
            .from('messages')
            .select('*, ads:ad_id(titulo, imagens, preco), sender:sender_id(name, avatar_url, read_receipts), receiver:receiver_id(name, avatar_url, read_receipts)')
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
                    senderName: otherUser?.name || 'Usuário',
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
                    readReceipts: otherUser?.read_receipts ?? true
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
