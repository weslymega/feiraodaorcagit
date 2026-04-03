import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, logAdminAction } from "../_shared/requireAdmin.ts";

const FUNCTION_NAME = "admin_manage_roles";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing critical environment variables");
        }

        // ── STEP 1: Admin Auth Guard ─────────────────────────────────────────────
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const auth = await requireAdmin(req, adminClient, corsHeaders, FUNCTION_NAME);
        if (auth.error) return auth.response;

        const { adminId } = auth;

        // ── STEP 2: Parse and Validate Body ─────────────────────────────────────
        let body: { targetUserId?: string; newAdminStatus?: unknown };
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "INVALID_BODY" }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { targetUserId, newAdminStatus } = body;

        if (!targetUserId || typeof newAdminStatus !== 'boolean') {
            return new Response(JSON.stringify({
                error: "MISSING_PARAMS",
                message: "targetUserId (string) e newAdminStatus (boolean) são obrigatórios."
            }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Prevent self-demotion to avoid admin lockout
        if (adminId === targetUserId && newAdminStatus === false) {
            return new Response(JSON.stringify({
                error: "FORBIDDEN",
                message: "Auto-rebaixamento de admin não é permitido."
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── STEP 3: Execute Role Change ──────────────────────────────────────────
        const { data: updatedProfile, error: updateError } = await adminClient
            .from("profiles")
            .update({ is_admin: newAdminStatus })
            .eq("id", targetUserId)
            .select()
            .single();

        if (updateError) throw updateError;

        logAdminAction(FUNCTION_NAME, 'change_role', adminId, targetUserId, true, {
            newAdminStatus,
        });

        return new Response(JSON.stringify({ success: true, user: updatedProfile }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error(`[${FUNCTION_NAME}] Unhandled exception:`, err);
        const detail = err instanceof Error
            ? { message: err.message, name: err.name }
            : String(err);
        return new Response(JSON.stringify({ error: "INTERNAL_ERROR", detail }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
