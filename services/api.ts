import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export const api = {
    /**
     * Create Ad via Edge Function (Secured Limit Check)
     */
    createAd: async (adData: CreateAdPayload) => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) throw new Error('User not authenticated');

        const { data, error } = await supabase.functions.invoke('create_ad', {
            body: adData
        });

        if (error) {
            // Parse error passed from function
            try {
                // Supabase function errors might come in different shapes depending on invoke
                // But usually if it's a 4xx response from the function, invoke returns error
                const errorBody = await error.context?.json(); // hypothetical
                throw new Error(errorBody?.message || error.message);
            } catch (e) {
                throw new Error(error.message || 'Failed to create ad');
            }
        }

        // If function returned 403 explicitly via standard response
        // Client lib typically treats non-2xx as error? 
        // invoke returns { data, error }. If Edge Function returns 403, it ends up in error usually 
        // or data is null and we check response status if available.
        // Actually invoke returns: { data, error }
        // If the function throws or returns 500, error is populated.

        return data; // { data: newAd }
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
    }
};
