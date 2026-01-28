import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdStatus, User, ReportItem } from '../types';

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
 * Helper to map DB record (PT) to Item (EN) and clean strings
 */
const mapAdData = (ad: any, isOwner: boolean = false) => {
    // Determine mapped status
    let mappedStatus = AdStatus.PENDING;
    const dbStatus = cleanString(ad.status);

    if (['ativo', 'active'].includes(dbStatus)) mappedStatus = AdStatus.ACTIVE;
    if (['inativo', 'inactive'].includes(dbStatus)) mappedStatus = AdStatus.INACTIVE;
    if (['vendido', 'sold'].includes(dbStatus)) mappedStatus = AdStatus.SOLD;
    if (['rejeitado', 'rejected'].includes(dbStatus)) mappedStatus = AdStatus.REJECTED;

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
        // Real Profile Info
        ownerName: isOwner ? 'Eu' : (ad.profiles?.name || ad.ownerName || 'Vendedor'),
        ownerAvatar: ad.profiles?.avatar_url || ad.ownerAvatar || null,
        additionalInfo: detalhes.additionalInfo || ad.additionalInfo || [],
        isOwner: isOwner
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

    // Default for parts/services or others
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
                    status: 'pendente',
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

        if (error) return null;

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
            joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : ''
        } as User;
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
     * ADMIN: Moderate Ad Status
     */
    adminUpdateAdStatus: async (adId: string, status: AdStatus) => {
        // Map frontend status to backend enum
        const statusMap: Record<string, string> = {
            [AdStatus.ACTIVE]: 'active',
            [AdStatus.PENDING]: 'pending',
            [AdStatus.REJECTED]: 'rejected',
            [AdStatus.SOLD]: 'sold',
            [AdStatus.INACTIVE]: 'paused'
        };

        const { error } = await supabase
            .from('anuncios')
            .update({ status: statusMap[status] || 'pending' })
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
     * Get All Active Ads (Feed)
     */
    getAds: async () => {
        try {
            // Postgres ENUM 'ad_status' expects lowercase 'ativo'
            // JOIN with profiles to get seller info
            const { data, error } = await supabase
                .from('anuncios')
                .select('*, profiles:user_id(name, avatar_url)')
                .eq('status', 'ativo')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('⚠️ JOIN with profiles failed, retrying simple select...');
                const { data: simpleData, error: simpleError } = await supabase
                    .from('anuncios')
                    .select('*')
                    .eq('status', 'ativo')
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
    }
};
