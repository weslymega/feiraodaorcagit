import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/requireAdmin.ts";

const FUNCTION_NAME = "admin_get_stats";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // ── STEP 1: Admin Auth Guard ─────────────────────────────────────────────
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const auth = await requireAdmin(req, adminClient, corsHeaders, FUNCTION_NAME);
        if (auth.error) return auth.response;

        const { user } = auth;
        console.log(`[${FUNCTION_NAME}] Stats requested by admin ${user.email}`);

        // ── STEP 2: Execute Queries ──────────────────────────────────────────────

        // Total de usuários
        const { count: totalUsers, error: errUsers } = await adminClient
            .from("profiles")
            .select("id", { count: "exact", head: true });
        if (errUsers) throw errUsers;

        // Total de anúncios ativos
        const { count: activeAds, error: errAds } = await adminClient
            .from("anuncios")
            .select("id", { count: "exact", head: true })
            .eq("status", "ativo");
        if (errAds) throw errAds;

        // Receita total e Planos vendidos
        const { data: payments, error: paymentsError } = await adminClient
            .from("pagamentos_destaque")
            .select("valor")
            .eq("status", "approved");
        if (paymentsError) throw paymentsError;

        const totalRevenue = payments.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
        const plansSold = payments.length;

        return new Response(JSON.stringify({
            totalUsers: totalUsers ?? 0,
            activeAds: activeAds ?? 0,
            totalRevenue,
            plansSold,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error(`[${FUNCTION_NAME}] Internal Error:`, err);
        return new Response(
            JSON.stringify({ error: "INTERNAL_ERROR", detail: String(err) }),
            { status: 500, headers: corsHeaders }
        );
    }
});
