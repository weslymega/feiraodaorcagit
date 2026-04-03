import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Confia no verify_jwt = true do gateway
        // Extrai o userId diretamente do JWT validado (opcional para check de RLS manual, se necessário)
        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')
        const payload = token ? JSON.parse(atob(token.split('.')[1])) : null
        const userId = payload?.sub

        // Inicializa client com SERVICE_ROLE para bypass de RLS interno
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        )

        // Parse Body
        const body = await req.json()
        const { adId, turboType } = body

        if (!adId || !turboType) {
            return new Response(
                JSON.stringify({ success: false, error: 'adId e turboType são obrigatórios' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Regras de Negócio
        const { data: ad, error: adError } = await supabase
            .from('anuncios')
            .select('id, user_id, status')
            .eq('id', adId)
            .single()

        if (adError || !ad) {
            return new Response(
                JSON.stringify({ success: false, error: 'Anúncio não encontrado' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (userId && ad.user_id !== userId) {
            return new Response(
                JSON.stringify({ success: false, error: 'Acesso negado ao anúncio' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (ad.status !== 'ativo' && ad.status !== 'active') {
            return new Response(
                JSON.stringify({ success: false, error: 'O anúncio precisa estar ativo para usar o Turbo' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const typeNormalized = String(turboType).toLowerCase()
        let requiredSteps = 0

        if (typeNormalized === 'premium') requiredSteps = 2
        else if (typeNormalized === 'pro') requiredSteps = 5
        else if (typeNormalized === 'max') requiredSteps = 7
        else {
            return new Response(
                JSON.stringify({ success: false, error: 'turboType inválido (premium, pro, max)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Persistência
        const { data: session, error: sessionError } = await supabase
            .from('ad_turbo_sessions')
            .insert({
                ad_id: adId,
                user_id: userId || ad.user_id,
                turbo_type: typeNormalized,
                required_steps: requiredSteps,
                current_step: 0,
                status: 'active'
            })
            .select('id, required_steps')
            .single()

        if (sessionError) {
            console.error("DB Error:", sessionError.message)
            return new Response(
                JSON.stringify({ success: false, error: 'Erro interno ao criar sessão' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Session created: ${session.id} for ad: ${adId}`)

        // Sucesso
        return new Response(
            JSON.stringify({
                success: true,
                sessionId: session.id,
                requiredSteps: session.required_steps
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err: any) {
        console.error("Edge Function Error:", err.message)
        return new Response(
            JSON.stringify({ success: false, error: 'Erro interno inesperado' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
