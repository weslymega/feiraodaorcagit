import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações CORS padrão do Supabase Edge Functions
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 6. Retornar respostas padronizadas
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

        // 🎯 ARQUITETURA ADMIN-FIRST
        // Inicializa client com SERVICE_ROLE para bypass de RLS interno nas leituras/escritas protegidas
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 4. Garantir que userId venha do JWT validado (Zero confiança no frontend)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('[activate-turbo] Tentativa de acesso sem Authorization header.');
            return jsonResponse({ success: false, error: 'Token de autenticação ausente' }, 401);
        }

        // Cliente do Usuário apenas para VALIDAR o Token JWT original no Supabase Auth
        const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
            global: { headers: { Authorization: authHeader } }
        });

        // Extrai apenas do token validado 
        const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
        if (userError || !user) {
            console.error(`[activate-turbo] Falha na validação do JWT: ${userError?.message}`);
            return jsonResponse({ success: false, error: 'Token inválido ou expirado' }, 401);
        }

        // 2. Extrair e validar inputs do body
        const { adId, turboType } = await req.json();

        if (!adId || !turboType) {
            console.warn(`[activate-turbo] Body inválido recebido do usuário ${user.id}`);
            return jsonResponse({ success: false, error: 'adId e turboType são obrigatórios' }, 400);
        }

        // 2️⃣ Validar fortemente o turboType e mapear internamente
        const normalizedType = String(turboType).toLowerCase();
        let requiredSteps = 0;

        // Aceitar SOMENTE plan IDs validados e imutáveis via backend
        if (normalizedType === 'premium') requiredSteps = 2; // Bronze equivalent maybe? Or actual premium plan?
        else if (normalizedType === 'pro') requiredSteps = 5;
        else if (normalizedType === 'max') requiredSteps = 7;
        else {
            console.warn(`[activate-turbo] Usuário ${user.id} tentou injetar turboType inválido: ${turboType}`);
            return jsonResponse({ success: false, error: 'turboType inválido (permitidos: premium, pro, max)' }, 400);
        }

        console.log(`[activate-turbo] Usuário ${user.id} solicitando turbo modelo '${normalizedType}' para anúncio ${adId}`);

        // 3️⃣ Não permitir ativar turbo em anúncio com problemas
        // 🎯 Validar Anúncio (Propriedade, Status e Existência no banco via Admin)
        const { data: ad, error: adError } = await supabaseAdmin
            .from('anuncios')
            .select('id, user_id, status')
            .eq('id', adId)
            .single();

        if (adError || !ad) {
            console.error(`[activate-turbo] Anúncio ${adId} não localizado no banco.`);
            return jsonResponse({ success: false, error: 'Anúncio não encontrado' }, 404);
        }

        // Validar propriedade forte (Antifraude: Evita que user A turbine anúncio do user B)
        if (ad.user_id !== user.id) {
            console.error(`[activate-turbo] FRAUDE DETECTADA: User ${user.id} tentou ativar turbo no ad ${adId} de propriedade de ${ad.user_id}`);
            return jsonResponse({ success: false, error: 'Acesso negado: Você não é o proprietário deste anúncio' }, 403);
        }

        // Validar status forte: 'ativo' ou 'active'
        const adStatus = String(ad.status).toLowerCase();
        if (adStatus !== 'ativo' && adStatus !== 'active') {
            console.warn(`[activate-turbo] Anúncio ${adId} com status inválido para turbo: ${ad.status}`);
            return jsonResponse({ success: false, error: 'O anúncio precisa estar ATIVO para ser impulsionado.' }, 400);
        }

        // 1️⃣ Bloquear múltiplas sessões ativas
        // 🎯 Verificar se já existe uma sessão status = 'active' para o mesmo ad_id
        const { data: existingSession, error: existingSessionError } = await supabaseAdmin
            .from('ad_turbo_sessions')
            .select('id')
            .eq('ad_id', adId)
            .eq('status', 'active')
            .maybeSingle(); // maybeSingle para não estourar erro 406 caso não exista

        if (existingSessionError) {
            console.error(`[activate-turbo] DB Error ao checar sessões ativas: ${existingSessionError.message}`);
            return jsonResponse({ success: false, error: 'Erro de verificação de sessão interna' }, 500);
        }

        if (existingSession) {
            console.warn(`[activate-turbo] Criação negada. Já existe sessão ATIVA (${existingSession.id}) para o anúncio ${adId}`);
            // Se existir → retornar erro 409 (Conflict) conforme regra
            return jsonResponse({ success: false, error: 'Já existe uma sessão de visualização ativa para este anúncio.' }, 409);
        }

        // 5️⃣ Estrutura recomendada da sessão (Persistência Segura)
        console.log(`[activate-turbo] Passou em todas as validações. Criando sessão { turbo: ${normalizedType}, steps: ${requiredSteps} }...`);

        const { data: newSession, error: insertError } = await supabaseAdmin
            .from('ad_turbo_sessions')
            .insert({
                ad_id: adId,
                user_id: user.id, // Veio com 100% de garantia do JWT verificado
                turbo_type: normalizedType,
                required_steps: requiredSteps,
                current_step: 0,
                status: 'active'
                // created_at é automático com now() no banco
            })
            .select('id, required_steps') // Retorna os dados para compor a resposta padronizada
            .single();

        if (insertError || !newSession) {
            console.error(`[activate-turbo] Falha CRÍTICA ao inserir sessão:`, insertError);
            return jsonResponse({ success: false, error: 'Erro interno crasso ao persistir a sessão de acompanhamento.' }, 500);
        }

        console.log(`[activate-turbo] Sessão ${newSession.id} gerada com sucesso.`);

        // 6. Retorno padronizado de Sucesso
        return jsonResponse({
            success: true,
            sessionId: newSession.id,
            requiredSteps: newSession.required_steps
        });

    } catch (err: any) {
        console.error('[activate-turbo] Erro Genérico Inesperado:', err.message);
        return jsonResponse({ success: false, error: 'Erro interno de servidor' }, 500);
    }
});

