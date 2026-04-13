import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (data: object, status: number = 200) => {
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
    });
};

serve(async (req) => {
    console.log('[EDGE] FUNÇÃO CHAMADA');
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('[EDGE ERROR] Authorization header missing');
            return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
        }

        const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
        if (userError || !user) {
            console.error('[EDGE ERROR] User auth error:', userError);
            return jsonResponse({ success: false, error: 'JWT_EXPIRED' }, 401);
        }

        console.log('[EDGE] USER:', user?.id);

        const { adId } = await req.json();
        console.log('[EDGE] adId:', adId);
        if (!adId) {
            console.error('[EDGE ERROR] adId missing in payload');
            return jsonResponse({ success: false, error: 'adId é obrigatório' }, 400);
        }

        // 1. Buscar Anúncio (Validar Posse e Cooldown)
        const { data: ad, error: adFetchError } = await supabaseAdmin
            .from('anuncios')
            .select('*')
            .eq('id', adId)
            .single();

        if (adFetchError || !ad) {
            console.error('[EDGE ERROR] Ad not found:', adFetchError);
            return jsonResponse({ success: false, error: 'Anúncio não encontrado' }, 404);
        }

        if (ad.user_id !== user.id) {
            console.error('[EDGE ERROR] Access denied for user:', user.id, 'on ad:', adId);
            return jsonResponse({ success: false, error: 'Acesso negado' }, 403);
        }

        // 🛡️ PROTEÇÃO 1: Frequência de Recompensas (Anti-Spam / Duplo Clique)
        // Verificamos antes do RPC para evitar locks desnecessários no banco
        const now = new Date();
        const lastTurbo = ad.last_turbo_at ? new Date(ad.last_turbo_at) : new Date(0);
        const cooldownMs = 3000; // 3 segundos
        if (now.getTime() - lastTurbo.getTime() < cooldownMs) {
            console.error('[EDGE ERROR] Cooldown active');
            return jsonResponse({ 
                success: false, 
                error: 'Aguarde um momento antes de aplicar a próxima recompensa.',
                cooldown: true
            }, 429);
        }

        // 🛡️ PROTEÇÃO 2: Limite de Progresso
        const MAX_PROGRESS = 1000;
        if ((ad.turbo_progress || 0) >= MAX_PROGRESS) {
             console.error('[EDGE ERROR] Max progress reached');
             return jsonResponse({ success: false, error: 'Limite de turbos atingido para este anúncio.' }, 400);
        }

        // 2. CHAMAR MASTER RPC ATÔMICO
        // Toda a lógica de incremento, nível e expiração ocorre em uma única transação no banco.
        const { data: result, error: rpcError } = await supabaseUser.rpc('apply_turbo_reward_atomic', { 
            ad_id: adId 
        });

        if (rpcError || !result) {
            console.error('[EDGE ERROR] MASTER RPC ERROR:', rpcError);
            return jsonResponse({ 
                success: false, 
                error: 'Falha crítica ao processar recompensa atômica.',
                details: rpcError?.message 
            }, 500);
        }

        const { turbo_progress, turbo_type, previous_turbo_type, turbo_expires_at } = result;

        // 3. Determinar UUID do Plano para Histórico
        let planId = 'f174fc27-88a8-4ac4-a26f-2cd0b8b81cd9'; // Premium default
        if (turbo_type === 'pro') planId = '90c61495-d664-464c-92f6-8c489a695283';
        if (turbo_type === 'max') planId = '072d6be5-4e77-4c75-9ad5-2df2f3cf562b';

        // 4. Registrar Histórico (Resiliente)
        try {
            const { error: highlightError } = await supabaseAdmin
                .from('ad_highlights')
                .insert({
                    ad_id: adId,
                    user_id: user.id,
                    plan_id: planId,
                    status: 'active',
                    starts_at: now.toISOString(),
                    ends_at: turbo_expires_at
                });
            
            if (highlightError) console.error('[apply-turbo-reward] Highlight history error:', highlightError);
        } catch (e) {
            console.error('[apply-turbo-reward] Silently failed to log highlight:', e);
        }

        return jsonResponse({
            success: true,
            turbo_type,
            previous_turbo_type,
            turbo_progress,
            turbo_expires_at,
            message: `Turbo ${turbo_type} aplicado! Registro #${turbo_progress}.`
        });

    } catch (err: any) {
        console.error('[apply-turbo-reward] Unexpected Error:', err.message);
        return jsonResponse({ success: false, error: 'Erro interno de servidor' }, 500);
    }
});
