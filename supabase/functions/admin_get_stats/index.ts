import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('[AdminStats] Missing Authorization header');
            return new Response(JSON.stringify({ error: "Missing Authorization header", code: "ERR_AUTH_HEADER_MISSING" }), { status: 401, headers: corsHeaders });
        }

        // 2. Create an admin client for service-role actions
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 3. Validate Authenticated User using the token directly with Admin Client
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

        if (authError || !user) {
            console.error('[AdminStats] Auth error:', authError);
            return new Response(JSON.stringify({
                error: "Unauthorized",
                details: authError?.message || "Invalid token",
                code: "ERR_AUTH_INVALID_TOKEN"
            }), { status: 401, headers: corsHeaders });
        }

        // 4. Validate Admin Role
        const { data: profile, error: profileError } = await adminClient
            .from("profiles")
            .select("role, is_admin")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error('[AdminStats] Profile fetch error:', profileError);
            return new Response(JSON.stringify({ error: "Server Error", message: "Could not verify profile" }), { status: 500, headers: corsHeaders });
        }

        if (profile?.role !== 'admin' && !profile?.is_admin) {
            console.warn(`[AdminStats] Unauthorized access attempt by ${user.email} (ID: ${user.id})`);
            return new Response(JSON.stringify({
                error: "Forbidden",
                message: "Acesso restrito a administradores.",
                debug: { role: profile?.role, is_admin: profile?.is_admin }
            }), { status: 403, headers: corsHeaders });
        }

        console.log(`[AdminStats] Generating report for admin ${user.email}`);

        // 5. Execute Queries

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

        // Receita total e Planos vendidos (approved payments)
        const { data: payments, error: paymentsError } = await adminClient
            .from("pagamentos_destaque")
            .select("valor")
            .eq("status", "approved");

        if (paymentsError) {
            console.error('[AdminStats] Payments query error:', paymentsError);
            // Non-critical if table exists but has issues, but here we throw for visibility
            throw paymentsError;
        }

        const totalRevenue = payments.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
        const plansSold = payments.length;

        // 6. Return Data
        return new Response(JSON.stringify({
            totalUsers: totalUsers || 0,
            activeAds: activeAds || 0,
            totalRevenue: totalRevenue,
            plansSold: plansSold
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[AdminStats] Internal Error:', err);
        return new Response(
            JSON.stringify({ error: "INTERNAL_ERROR", detail: String(err) }),
            { status: 500, headers: corsHeaders }
        );
    }
});
