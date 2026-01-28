import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) return new Response("Não autorizado", { status: 401 });

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user: requester }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !requester) throw new Error("Usuário não identificado");

        // VALIDAR SE É ADMIN PARA AS DEMAIS AÇÕES
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', requester.id).single();
        if (!profile?.is_admin) return new Response("Acesso Proibido", { status: 403, headers: corsHeaders });

        const body = await req.json();
        const { action, reportId, status } = body;

        // 1. LISTAR REPORTS
        if (action === 'list') {
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    reporter:profiles!reporter_id(id, name)
                `)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2. ATUALIZAR STATUS
        if (action === 'update_status') {
            if (status !== 'resolved' && status !== 'dismissed') {
                return new Response(JSON.stringify({ error: "Status inválido. Use 'resolved' ou 'dismissed'." }), { status: 400, headers: corsHeaders });
            }
            const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. DELETAR REPORT
        if (action === 'delete') {
            const { error } = await supabase.from('reports').delete().eq('id', reportId);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response("Ação inválida", { status: 400, headers: corsHeaders });

    } catch (err) {
        console.error("ERRO NA EDGE FUNCTION:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
});
