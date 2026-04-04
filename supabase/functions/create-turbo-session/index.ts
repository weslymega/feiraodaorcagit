import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Manuseio de Preflight (CORS)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Não autorizado', code: 'ERR_MISSING_AUTH' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Cliente Anon apenas para validar o TOKEN do usuário
        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // 🎯 ARQUITETURA ADMIN-FIRST
        // Cliente Admin para operações que ignoram RLS (Segurança via Código)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 2. Validar Usuário (Zero confiança no frontend)
        const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
        if (userError || !user) {
            console.error(`[create-turbo-session] JWT FAIL: ${userError?.message}`);
            return new Response(JSON.stringify({ error: 'Não autorizado', code: 'ERR_INVALID_JWT' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // 3. Extrair e validar inputs do body
        const { adId, turboType } = await req.json();

        if (!adId || !turboType) {
            return new Response(JSON.stringify({ error: 'adId e turboType são obrigatórios' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // 4. Validar Anúncio (via Admin Client para ler sem erros de RLS)
        const { data: ad, error: adError } = await supabaseAdmin
            .from('anuncios')
            .select('id, user_id, status, turbo_expires_at')
            .eq('id', adId)
            .single();

        if (adError || !ad) {
            return new Response(JSON.stringify({ error: 'Anúncio não encontrado' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            });
        }

        // 🛡️ VALIDAÇÃO DE PROPRIEDADE (Bypass RLS local)
        if (ad.user_id !== user.id) {
            console.error(`[create-turbo-session] FRAUDE: User ${user.id} tentou acessar ad ${adId} de ${ad.user_id}`);
            return new Response(JSON.stringify({ error: 'Acesso negado ao anúncio' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            });
        }

        // 🛡️ VALIDAÇÃO DE STATUS
        if (ad.status !== 'ativo' && ad.status !== 'active') {
            return new Response(JSON.stringify({ error: 'O anúncio precisa estar ativo para usar o Turbo' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // 🛡️ VALIDAÇÃO DE TURBO EXISTENTE
        if (ad.turbo_expires_at && new Date(ad.turbo_expires_at) > new Date()) {
          return new Response(JSON.stringify({ 
              error: 'TURBO_ALREADY_ACTIVE', 
              message: 'Este anúncio já possui um destaque ativo.',
              expiresAt: ad.turbo_expires_at 
          }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
          });
        }

        // 5. Mapear steps do Turbo
        const typeNormalized = String(turboType).toLowerCase();
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

        // 6. Criar Sessão via ADMIN CLIENT (Blind insert confiável)
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('ad_turbo_sessions')
            .insert({
                ad_id: adId,
                user_id: user.id, // Garantido pelo JWT validado
                turbo_type: typeNormalized,
                required_steps: requiredSteps,
                current_step: 0,
                status: 'active'
            })
            .select('id, required_steps')
            .single();

        if (sessionError) {
            console.error(`[create-turbo-session] Erro crasso na inserção:`, sessionError);
            return new Response(JSON.stringify({ error: 'Erro ao criar sessão', details: sessionError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        console.log(`[create-turbo-session] Sucesso: Sessão ${session.id} criada para user ${user.id}`);

        // 7. Retorno Padronizado
        return new Response(JSON.stringify({
            success: true,
            sessionId: session.id,
            requiredSteps: session.required_steps
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        console.error('[create-turbo-session] Erro Interno:', err.message);
        return new Response(JSON.stringify({
            error: 'Erro interno inesperado',
            details: err.message || 'Unknown error'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

