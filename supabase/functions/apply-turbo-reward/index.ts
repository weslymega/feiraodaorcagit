import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (data: object, status: number = 200) => {
    // DEBUG MODE: Always return 200 to allow client to see the error body
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });
};

serve(async (req) => {
    console.log("[STEP 1] Função iniciada");
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const authHeader = req.headers.get('Authorization');
        console.log("[STEP 2] Authorization header:", authHeader);
        if (!authHeader) {
            console.error('[ERRO AUTH] Authorization header missing');
            return jsonResponse({ success: false, error: 'ETAPA_2_FALHOU' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const supabaseUser = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
        if (userError || !user) {
            console.error('[ERRO USER] User auth error:', userError);
            return jsonResponse({ 
                success: false, 
                error: 'ETAPA_3_FALHOU',
                details: userError?.message
            }, 401);
        }

        console.log("[STEP 3] USER:", user?.id);

        const { adId } = await req.json();
        console.log("[STEP 4] adId recebido:", adId);
        if (!adId) {
            console.error('[ERRO INPUT] adId missing');
            return jsonResponse({ success: false, error: 'ETAPA_4_FALHOU' }, 400);
        }

        // 1. Buscar Anúncio
        console.log("[STEP 5] Buscando anúncio...");
        const { data: ad, error: adFetchError } = await supabaseAdmin
            .from('anuncios')
            .select('*')
            .eq('id', adId)
            .single();

        if (adFetchError || !ad) {
            console.error('[ERRO BUSCA] Ad not found:', adFetchError);
            return jsonResponse({ success: false, error: 'ETAPA_5_FALHOU' }, 404);
        }
        console.log("[STEP 6] AD:", ad);

        // Validar Posse
        console.log("[STEP 7] user.id:", user.id);
        console.log("[STEP 8] ad.user_id:", ad.user_id);
        if (ad.user_id !== user.id) {
            console.error('[ERRO POSSE] Access denied');
            return jsonResponse({ success: false, error: 'ETAPA_8_FALHOU' }, 403);
        }

        // 🛡️ PROGRESSO E COOLDOWN
        const now = new Date();
        const lastTurbo = ad.last_turbo_at ? new Date(ad.last_turbo_at) : new Date(0);
        console.log(`[STEP 9] currentProgress: ${ad.turbo_progress || 0}`);
        console.log(`[STEP 9] TIME CHECK - Now: ${now.toISOString()}, LastTurbo: ${lastTurbo.toISOString()}`);
        
        if (now.getTime() - lastTurbo.getTime() < 3000) {
            console.error('[ERRO COOLDOWN] Cooldown active');
            return jsonResponse({ 
                success: false, 
                error: 'ETAPA_9_FALHOU',
                details: `Cooldown ativo. Diferença: ${now.getTime() - lastTurbo.getTime()}ms`
            }, 429);
        }

        console.log("[STEP 10] newProgress check logic...");
        if ((ad.turbo_progress || 0) >= 1000) {
             console.error('[ERRO MAX_PROGRESS] Limit reached');
             return jsonResponse({ success: false, error: 'ETAPA_10_FALHOU' }, 400);
        }

        console.log("[STEP 11] currentExpiry:", ad.turbo_expires_at);
        console.log("[STEP 12] newExpiry calculation flow...");

        // 2. ATUALIZAR (VIA RPC ATÔMICO COM PRIVILÉGIO ADMIN)
        console.log("[STEP 13] Atualizando anúncio (ADMIN RPC)...");
        const { data: result, error: rpcError } = await supabaseAdmin.rpc('apply_turbo_reward_atomic', { 
            ad_id: adId,
            p_user_id: user.id
        });

        if (rpcError || !result) {
            console.error("[ERRO UPDATE ADMIN]", rpcError);
            return jsonResponse({ 
                success: false, 
                error: 'ETAPA_13_FALHOU',
                details: rpcError?.message
            }, 500);
        }

        const { turbo_progress, turbo_type, turbo_expires_at } = result;

        // Determinar Plano
        let planId = 'f174fc27-88a8-4ac4-a26f-2cd0b8b81cd9'; 
        if (turbo_type === 'pro') planId = '90c61495-d664-464c-92f6-8c489a695283';
        if (turbo_type === 'max') planId = '072d6be5-4e77-4c75-9ad5-2df2f3cf562b';

        // 3. REGISTRAR HISTÓRICO (PROTEGER COM TRY/CATCH)
        try {
            await supabaseAdmin.from('ad_highlights').insert({
                ad_id: adId,
                user_id: user.id,
                plan_id: planId,
                status: 'active',
                starts_at: now.toISOString(),
                ends_at: turbo_expires_at
            });
            console.log("[STEP 14] highlight inserido");
        } catch (e) {
            console.error("[ERRO HIGHLIGHT]", e);
            // Non-blocking error
        }

        console.log("[STEP 15] SUCESSO FINAL");
        return jsonResponse({
            success: true,
            turbo_type,
            turbo_progress,
            turbo_expires_at,
            message: `SUCESSO: Turbo ${turbo_type} aplicado!`
        });

    } catch (err: any) {
        console.error('[ERRO FATAL]', err.message);
        return jsonResponse({ success: false, error: 'ERRO_INTERNO' }, 500);
    }
});
