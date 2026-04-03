import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, logAdminAction } from "../_shared/requireAdmin.ts";

const FUNCTION_NAME = "admin_manage_users";

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

        // ── STEP 1: Admin Auth Guard (backend is the ONLY source of truth) ──────
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const auth = await requireAdmin(req, adminClient, corsHeaders, FUNCTION_NAME);
        if (auth.error) return auth.response; // 401 or 403 returned immediately

        const { adminId } = auth;

        // ── STEP 2: Parse and Validate Body ────────────────────────────────────
        let body: { action?: string; userId?: string; status?: boolean };
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "INVALID_BODY", message: "JSON inválido." }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { action, userId, status } = body;

        if (!action || !userId) {
            return new Response(JSON.stringify({ error: "MISSING_PARAMS", message: "action e userId são obrigatórios." }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (adminId === userId) {
            return new Response(JSON.stringify({ error: "FORBIDDEN", message: "Auto-gerenciamento não é permitido." }), {
                status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ── STEP 3: Execute Action ──────────────────────────────────────────────
        let result = null;

        if (action === 'toggle_block') {
            const { data, error } = await adminClient
                .from("profiles")
                .update({ is_blocked: status })
                .eq("id", userId)
                .select()
                .single();
            if (error) throw error;
            result = data;
            logAdminAction(FUNCTION_NAME, 'toggle_block', adminId, userId, true, { newStatus: status });

        } else if (action === 'delete') {
            const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
            if (deleteAuthError) throw deleteAuthError;
            await adminClient.from("profiles").delete().eq("id", userId);
            result = { deleted: true };
            logAdminAction(FUNCTION_NAME, 'delete_user', adminId, userId, true);

        } else {
            return new Response(JSON.stringify({ error: "INVALID_ACTION", message: `Ação desconhecida: ${action}` }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error(`[${FUNCTION_NAME}] Unhandled exception:`, err);
        const detail = (err && typeof err === 'object')
            ? JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
            : String(err);
        return new Response(JSON.stringify({
            error: "INTERNAL_ERROR",
            message: "Erro interno do servidor.",
            detail,
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
