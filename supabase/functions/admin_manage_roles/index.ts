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
            throw new Error("Missing critical environment variables in roles function");
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
            console.error("[AUTH_FAILED_ROLES]", authError);
            return new Response(JSON.stringify({
                error: "Unauthorized: Invalid JWT",
                message: authError?.message || "Failed to identify requester"
            }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- STEP 2: Verify Admin Status ---
        const { data: requesterProfile, error: profileError } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", requester.id)
            .single();

        if (profileError || !requesterProfile?.is_admin) {
            return new Response(JSON.stringify({ error: "FORBIDDEN: Administrative privileges required" }), {
                status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // --- STEP 3: Process Role change ---
        const { targetUserId, newAdminStatus } = await req.json();

        if (!targetUserId || typeof newAdminStatus !== 'boolean') {
            return new Response(JSON.stringify({ error: "Missing parameters" }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (requester.id === targetUserId && newAdminStatus === false) {
            return new Response(JSON.stringify({ error: "Self-demotion not allowed" }), {
                status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update({ is_admin: newAdminStatus })
            .eq("id", targetUserId)
            .select()
            .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true, user: updatedProfile }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error("Critical Roles Exception:", err);
        const errorDetail = err instanceof Error ? {
            message: err.message, stack: err.stack, name: err.name
        } : err;

        return new Response(JSON.stringify({
            error: "INTERNAL_ERROR", detail: errorDetail
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
