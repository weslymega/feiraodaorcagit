import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdStatus, User } from '../types';

// NOTE: These should be in .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

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

    return {
        id: ad.id,
        title: cleanString(ad.titulo || ad.title) || 'Sem título',
        description: cleanString(ad.descricao || ad.descrição || ad.description),
        price: Number(ad.preco || ad.price || 0),
        category: cleanString(ad.categoria || ad.category) || 'outros',
        image: (ad.imagens?.[0] || ad.image || 'https://placehold.co/600x400?text=Sem+Foto'),
        images: Array.isArray(ad.imagens) ? ad.imagens : (ad.image ? [ad.image] : []),
        location: cleanString(ad.localizacao || ad.location) || 'Brasil',
        status: mappedStatus,
        boostPlan: cleanString(ad.boost_plan || ad.boostPlan) || 'gratis',
        ...(ad.detalhes || {}),
        createdAt: ad.created_at || ad.createdAt,
        updatedAt: ad.updated_at || ad.updatedAt,
        userId: ad.user_id || ad.userId,
        // Real Profile Info
        ownerName: isOwner ? 'Eu' : (ad.profiles?.name || ad.ownerName || 'Vendedor'),
        ownerAvatar: ad.profiles?.avatar_url || ad.ownerAvatar || null,
        year: ad.detalhes?.year || ad.year || new Date().getFullYear(),
        mileage: ad.detalhes?.mileage || ad.mileage || 0,
        fipePrice: ad.detalhes?.fipePrice || ad.fipePrice || 0,
        additionalInfo: ad.detalhes?.additionalInfo || ad.additionalInfo || [],
        isOwner: isOwner
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

        try {
            // Try Edge Function first (has limit checking)
            const { data, error } = await supabase.functions.invoke('create_ad', {
                body: adData
            });

            if (error) {
                console.warn('Edge Function failed, using direct insert:', error.message);
                throw error; // Will be caught and use fallback
            }

            return mapAdData(data, true);
        } catch (edgeFunctionError) {
            // Fallback: Direct insert to database
            console.log('📝 Usando inserção direta no banco (Edge Function não disponível)');

            const { data: ad, error: insertError } = await supabase
                .from('anuncios')
                .insert({
                    user_id: session.user.id,
                    titulo: adData.title,
                    descricao: adData.description,
                    preco: adData.price,
                    categoria: adData.category === 'autos' ? 'veiculos' : adData.category,
                    status: 'pendente', // Aguarda aprovação do admin
                    imagens: adData.image ? [adData.image] : [],
                    localizacao: adData.location,
                    detalhes: {
                        year: adData.year,
                        mileage: adData.mileage,
                        vehicleType: adData.vehicleType,
                        fuel: adData.fuel,
                        gearbox: adData.gearbox,
                        color: adData.color,
                        plate: adData.plate,
                        features: adData.features,
                        additionalInfo: adData.additionalInfo,
                        fipePrice: adData.fipePrice
                    },
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
        return data;
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
