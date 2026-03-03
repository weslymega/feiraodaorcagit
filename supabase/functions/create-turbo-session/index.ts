import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Garantir que OPTIONS retorne Response
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: { Authorization: authHeader }
            }
        });

        // 2. Validar Usuário
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // 3. Validar Body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Body inválido' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const { adId, turboType } = body;
        if (!adId || !turboType) {
            return new Response(JSON.stringify({ error: 'adId e turboType são obrigatórios' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // 4. Validar Anúncio
        const { data: ad, error: adError } = await supabaseClient
            .from('anuncios')
            .select('id, user_id, status')
            .eq('id', adId)
            .single();

        if (adError || !ad) {
            return new Response(JSON.stringify({ error: 'Anúncio não encontrado' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            });
        }

        if (ad.user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Acesso negado ao anúncio' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            });
        }

        // Validação de status: 'ativo'
        if (ad.status !== 'ativo' && ad.status !== 'active') {
            return new Response(JSON.stringify({ error: 'O anúncio precisa estar ativo para usar o Turbo' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // 5. Validar turboType e steps
        const typeNormalized = turboType.toLowerCase();
        let requiredSteps = 0;
        if (typeNormalized === 'premium') requiredSteps = 2;
        else if (typeNormalized === 'pro') requiredSteps = 5;
        else if (typeNormalized === 'max') requiredSteps = 7;
        else {
            return new Response(JSON.stringify({ error: 'turboType inválido (premium, pro, max)' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // 6. Criar Sessão
        // IMPORTANTE: Status deve ser 'active' conforme solicitado pelo usuário
        const { data: session, error: sessionError } = await supabaseClient
            .from('ad_turbo_sessions')
            .insert({
                ad_id: adId,
                user_id: user.id,
                turbo_type: typeNormalized,
                required_steps: requiredSteps,
                current_step: 0,
                status: 'active'
            })
            .select('id, required_steps')
            .single();

        if (sessionError) {
            return new Response(JSON.stringify({ error: 'Erro ao criar sessão', details: sessionError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        // 7. Retorno Sucesso
        return new Response(JSON.stringify({
            success: true,
            sessionId: session.id,
            requiredSteps: session.required_steps
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        // Fallback final para evitar EarlyDrop
        return new Response(JSON.stringify({
            error: 'Erro interno inesperado',
            details: err.message || 'Unknown error'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
