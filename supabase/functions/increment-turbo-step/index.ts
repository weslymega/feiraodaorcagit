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
    // 1. Manuseio de Preflight (CORS)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Contexto com Service Role para operações administrativas
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 2. Validar Usuário (Zero confiança no frontend)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
        }

        const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
        if (userError || !user) {
            return jsonResponse({ success: false, error: 'Token inválido ou expirado' }, 401);
        }

        // 3. Extrair Inputs
        const { sessionId } = await req.json();
        console.log("SESSION ID RECEIVED:", sessionId);

        if (!sessionId) {
            return jsonResponse({ success: false, error: 'sessionId é obrigatório' }, 400);
        }

        // 4. Buscar e Validar Sessão
        const { data: session, error: sessionFetchError } = await supabaseAdmin
            .from('ad_turbo_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionFetchError || !session) {
            console.error(`[increment-turbo-step] Sessão ${sessionId} não encontrada.`);
            return jsonResponse({ success: false, error: 'Sessão não encontrada' }, 404);
        }

        if (session.user_id !== user.id) {
            console.error(`[increment-turbo-step] FRAUDE: User ${user.id} tentou acessar sessão de ${session.user_id}`);
            return jsonResponse({ success: false, error: 'Acesso negado' }, 403);
        }

        // 🛡️ 4.1 Proteção de Expiração
        const now = new Date();
        const expiresAtDate = session.expires_at ? new Date(session.expires_at) : null;
        if (expiresAtDate && expiresAtDate < now) {
            console.error(`[increment-turbo-step] SESSION_EXPIRED: ${sessionId}`);
            return jsonResponse({ success: false, error: 'SESSION_EXPIRED' }, 400);
        }

        // 🛡️ 4.2 Proteção de Conclusão / Atividade
        if (session.status !== 'active') {
            return jsonResponse({ success: false, error: 'Esta sessão não está ativa' }, 400);
        }
        if (session.current_step >= session.required_steps) {
            console.warn(`[increment-turbo-step] SESSION_ALREADY_COMPLETED: ${sessionId}`);
            return jsonResponse({ success: false, error: 'SESSION_ALREADY_COMPLETED' }, 400);
        }

        console.log("USER ID:", user.id);
        console.log("SESSION FOUND:", session);
        console.log("CURRENT STEP BEFORE:", session.current_step);

        // 4. Update session step (Atomic)
        const newStep = Math.min(session.current_step + 1, session.required_steps);

        const { data: updatedRows, error: updateError, count } = await supabaseAdmin
            .from('ad_turbo_sessions')
            .update({
                current_step: newStep
            }, { count: 'exact' })
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .eq('current_step', session.current_step) // Previne update duplicado
            .select('*');

        if (updateError) {
            console.error("❌ Update error:", updateError);
            return jsonResponse({ success: false, error: "DB_UPDATE_FAILED", details: updateError.message }, 500);
        }

        console.log("ROWS UPDATED:", count);

        if (count === 0) {
            console.warn("⚠️ No rows updated (Session might be non-active, unauthorized, or already incremented)");
            return jsonResponse({ success: false, error: "UPDATE_FAILED_NO_ROWS_AFFECTED" }, 400);
        }

        const updatedSession = updatedRows?.[0];

        if (!updatedSession) { // Should not happen if count > 0, but for type safety
            console.error('[increment-turbo-step] UPDATE_FAILED: No updated session data returned despite count > 0');
            return jsonResponse({
                success: false,
                error: 'UPDATE_FAILED_NO_SESSION_DATA',
                details: 'Concurrency conflict or unexpected DB behavior'
            }, 500);
        }

        console.log("STEP AFTER:", updatedSession.current_step);

        let turboActivated = false;
        let expiresAt: string | null = null;

        // 6. VERIFICAR CONCLUSÃO E ATIVAR TURBO
        if (updatedSession.current_step >= updatedSession.required_steps) {
            console.log(`[increment-turbo-step] Sessão ${sessionId} CONCLUÍDA. Ativando Turbo...`);

            const turboType = updatedSession.turbo_type;
            let durationDays = 1;
            let planoId = 'f174fc27-88a8-4ac4-a26f-2cd0b8b81cd9'; // Simples (Premium)

            if (turboType === 'pro') {
                durationDays = 3;
                planoId = '90c61495-d664-464c-92f6-8c489a695283';
            } else if (turboType === 'max') {
                durationDays = 7;
                planoId = '072d6be5-4e77-4c75-9ad5-2df2f3cf562b';
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + durationDays);
            expiresAt = endDate.toISOString();

            // A. Finalizar Sessão
            const { error: sessionUpdateError } = await supabaseAdmin
                .from('ad_turbo_sessions')
                .update({ status: 'completed' })
                .eq('id', sessionId);

            if (sessionUpdateError) {
                console.error('[increment-turbo-step] Erro ao finalizar sessão:', sessionUpdateError);
                return jsonResponse({ success: false, error: 'SESSION_FINALIZE_FAILED', details: sessionUpdateError.message }, 500);
            }

            // B. Criar Destaque (ad_highlights)
            const { error: highlightError } = await supabaseAdmin
                .from('ad_highlights')
                .insert({
                    ad_id: updatedSession.ad_id,
                    user_id: user.id,
                    plan_id: planoId,
                    status: 'active',
                    starts_at: startDate.toISOString(),
                    ends_at: expiresAt
                });

            if (highlightError) {
                console.error('[increment-turbo-step] Erro ao inserir destaque:', highlightError);
                return jsonResponse({ success: false, error: 'HIGHLIGHT_INSERT_FAILED', details: highlightError.message }, 500);
            }

            // 🛡️ C. ZERO TRUST: Verificar se o anúncio já foi destacado por outra sessão concorrente
            const { data: freshAd, error: freshAdError } = await supabaseAdmin
                .from('anuncios')
                .select('turbo_expires_at')
                .eq('id', updatedSession.ad_id)
                .single();

            if (!freshAdError && freshAd?.turbo_expires_at && new Date(freshAd.turbo_expires_at) > new Date()) {
                console.warn(`[increment-turbo-step] CONCURRENCY_CONFLICT: Ad ${updatedSession.ad_id} already boosted.`);
                return jsonResponse({ success: false, error: 'TURBO_ALREADY_ACTIVE' }, 400);
            }

            // D. SINGLE SOURCE OF TRUTH: Atualizar Anúncio (anuncios)
            const { error: adUpdateError } = await supabaseAdmin
                .from('anuncios')
                .update({
                    is_turbo: true,
                    turbo_type: updatedSession.turbo_type,
                    turbo_expires_at: expiresAt,
                    last_turbo_at: startDate.toISOString(),
                    boost_plan: updatedSession.turbo_type, 
                    updated_at: startDate.toISOString()
                })
                .eq('id', updatedSession.ad_id);

            if (adUpdateError) {
                console.error('[increment-turbo-step] Erro ao atualizar anúncio:', adUpdateError);
                return jsonResponse({ 
                    success: false, 
                    error: `AD_UPDATE_FAILED: ${adUpdateError.message}`, 
                    details: adUpdateError.details || adUpdateError.hint 
                }, 500);
            }

            turboActivated = true;
            console.log(`[increment-turbo-step] Sessão ${sessionId} ativada com sucesso para o anúncio ${updatedSession.ad_id}`);
        }

        // 7. Retorno Padronizado
        return jsonResponse({
            success: true,
            current_step: updatedSession.current_step,
            required_steps: updatedSession.required_steps,
            turbo_activated: turboActivated,
            expires_at: expiresAt
        });

    } catch (err: any) {
        console.error('[increment-turbo-step] Erro Inesperado:', err.message);
        return jsonResponse({ success: false, error: 'Erro interno de servidor' }, 500);
    }
});
