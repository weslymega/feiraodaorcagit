import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing critical environment variables");
        }

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace("Bearer ", "");

        const { data: { user: requester }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !requester) {
            console.error("[AUTH_FAILED]", authError);
            return new Response(JSON.stringify({
                error: "Unauthorized: Invalid JWT",
                message: authError?.message || "Failed to identify requester",
                detail: authError
            }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- STEP 2: Verify Admin Status ---
        const { data: requesterProfile, error: profileError } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", requester.id)
            .single();

        if (profileError || !requesterProfile?.is_admin) {
            console.error("[ADMIN_CHECK_FAILED]", profileError);
            return new Response(JSON.stringify({
                error: "FORBIDDEN: Admin privileges required",
                detail: profileError
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- STEP 3: Process Action ---
        const body = await req.json();
        const { action, userId, status } = body;

        console.log(`[ACTION_V5] ${action} on user ${userId}`);

        if (!action || !userId) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (requester.id === userId) {
            return new Response(JSON.stringify({ error: "Self-management not allowed" }), {
                status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let result = null;

        if (action === 'toggle_block') {
            const { data, error } = await supabase
                .from("profiles")
                .update({ is_blocked: status })
                .eq("id", userId)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else if (action === 'delete') {
            const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
            if (deleteAuthError) throw deleteAuthError;
            await supabase.from("profiles").delete().eq("id", userId);
            result = { deleted: true };
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error("Critical Exception V5:", err);
        // Better error serialization for DB errors
        const errorDetail = (err && typeof err === 'object') ? JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))) : String(err);

        return new Response(JSON.stringify({
            error: "INTERNAL_ERROR",
            message: "Erro interno: verifique se as colunas is_admin e is_blocked existem no banco.",
            detail: errorDetail
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
