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
        if (!sessionId) {
            return jsonResponse({ success: false, error: 'sessionId é obrigatório' }, 400);
        }

        // 4. Buscar e Validar Sessão (Usando Service Role para ignorar RLS e garantir integridade)
        const { data: session, error: sessionFetchError } = await supabaseAdmin
            .from('ad_turbo_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionFetchError || !session) {
            return jsonResponse({ success: false, error: 'Sessão não encontrada' }, 404);
        }

        // Segurança: Garantir que a sessão pertence ao usuário
        if (session.user_id !== user.id) {
            console.error(`[increment-turbo-step] FRAUDE: User ${user.id} tentou acessar sessão de ${session.user_id}`);
            return jsonResponse({ success: false, error: 'Sessão inválida ou não autorizada' }, 403);
        }

        // Validar Estado da Sessão
        if (session.status !== 'active') {
            return jsonResponse({ success: false, error: 'Esta sessão já foi concluída ou cancelada' }, 400);
        }

        if (session.current_step >= session.required_steps) {
            return jsonResponse({ success: false, error: 'Todos os passos já foram concluídos nesta sessão' }, 400);
        }

        // 5. INCREMENTO SEGURO (CONCORRÊNCIA)
        // Usamos update atômico para evitar duplicação em cliques rápidos
        const { data: updatedSession, error: updateError } = await supabaseAdmin
            .from('ad_turbo_sessions')
            .update({
                current_step: session.current_step + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('status', 'active') // Garantia extra de idempotência
            .eq('current_step', session.current_step) // Previne double-click
            .select('*')
            .single();

        if (updateError || !updatedSession) {
            console.error('[increment-turbo-step] Erro ao incrementar passo:', updateError);
            return jsonResponse({ success: false, error: 'Erro ao registrar progresso. Tente novamente.' }, 500);
        }

        let turboActivated = false;
        let expiresAt: string | null = null;

        // 6. VERIFICAR CONCLUSÃO E ATIVAR TURBO
        if (updatedSession.current_step >= updatedSession.required_steps) {
            console.log(`[increment-turbo-step] Sessão ${sessionId} CONCLUÍDA. Ativando Turbo...`);

            // Mapeamento de Planos e Duração
            const turboType = updatedSession.turbo_type;
            let durationDays = 1;
            let planoId = 'f174fc27-88a8-4ac4-a26f-2cd0b8b81cd9'; // Simples (Premium)

            if (turboType === 'pro') {
                durationDays = 3;
                planoId = '90c61495-d664-464c-92f6-8c489a695283'; // Médio (Pro)
            } else if (turboType === 'max') {
                durationDays = 7;
                planoId = '072d6be5-4e77-4c75-9ad5-2df2f3cf562b'; // Máximo (Max)
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + durationDays);
            expiresAt = endDate.toISOString();

            // Transação implícita (várias operações com Service Role)

            // A. Finalizar Sessão
            await supabaseAdmin
                .from('ad_turbo_sessions')
                .update({
                    status: 'completed',
                    completed_at: startDate.toISOString()
                })
                .eq('id', sessionId);

            // B. Criar Destaque
            const { error: highlightError } = await supabaseAdmin
                .from('destaques_anuncios')
                .insert({
                    anuncio_id: updatedSession.ad_id,
                    user_id: user.id,
                    plano_id: planoId,
                    status: 'active',
                    inicio_em: startDate.toISOString(),
                    fim_em: expiresAt
                });

            if (highlightError) {
                console.error('[increment-turbo-step] Erro ao criar destaque:', highlightError);
            }

            // C. Atualizar Anúncio (para fins de exibição imediata e filtragem)
            const { error: adUpdateError } = await supabaseAdmin
                .from('anuncios')
                .update({
                    boost_plan: planoId,
                    updated_at: startDate.toISOString()
                })
                .eq('id', updatedSession.ad_id);

            if (adUpdateError) {
                console.error('[increment-turbo-step] Erro ao atualizar boost_plan no anúncio:', adUpdateError);
            }

            turboActivated = true;
        }

        // 7. Retorno Padronizado
        return jsonResponse({
            success: true,
            current_step: updatedSession.current_step,
            required_steps: updatedSession.required_steps,
            remaining_steps: Math.max(0, updatedSession.required_steps - updatedSession.current_step),
            turbo_activated: turboActivated,
            expires_at: expiresAt
        });

    } catch (err: any) {
        console.error('[increment-turbo-step] Erro Inesperado:', err.message);
        return jsonResponse({ success: false, error: 'Erro interno de servidor' }, 500);
    }
});
