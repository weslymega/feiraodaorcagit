import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, logAdminAction } from "../_shared/requireAdmin.ts";

const FUNCTION_NAME = "admin_manage_reports";

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

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing critical environment variables");
        }

        // ── STEP 1: Admin Auth Guard ─────────────────────────────────────────────
        // FIXED: was returning plain text "Não autorizado" / "Acesso Proibido" before.
        // Now returns consistent JSON with proper HTTP status codes.
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const auth = await requireAdmin(req, adminClient, corsHeaders, FUNCTION_NAME);
        if (auth.error) return auth.response;

        const { adminId } = auth;

        // ── STEP 2: Parse Body ───────────────────────────────────────────────────
        let body: { action?: string; reportId?: string; status?: string; adId?: string };
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "INVALID_BODY" }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { action, reportId, status, adId } = body;

        // ── STEP 3: Execute Action ───────────────────────────────────────────────

        // 1. List reports
        if (action === 'list') {
            const { data, error } = await adminClient
                .from('reports')
                .select(`*, reporter:profiles!reporter_id(id, name)`)
                .order('created_at', { ascending: false });
            if (error) throw error;
            logAdminAction(FUNCTION_NAME, 'list_reports', adminId, null, true);
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2. Update report status
        if (action === 'update_status') {
            if (status !== 'resolved' && status !== 'dismissed') {
                return new Response(JSON.stringify({
                    error: "INVALID_VALUE",
                    message: "Status inválido. Use 'resolved' ou 'dismissed'."
                }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            if (!reportId) {
                return new Response(JSON.stringify({ error: "MISSING_PARAMS", message: "reportId é obrigatório." }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            const { error } = await adminClient.from('reports').update({ status }).eq('id', reportId);
            if (error) throw error;
            logAdminAction(FUNCTION_NAME, 'update_report_status', adminId, reportId, true, { newStatus: status });
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Delete a report record
        if (action === 'delete') {
            if (!reportId) {
                return new Response(JSON.stringify({ error: "MISSING_PARAMS", message: "reportId é obrigatório." }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            const { error } = await adminClient.from('reports').delete().eq('id', reportId);
            if (error) throw error;
            logAdminAction(FUNCTION_NAME, 'delete_report', adminId, reportId, true);
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. Delete an ad (and optionally resolve report)
        if (action === 'delete_ad') {
            if (!adId) {
                return new Response(JSON.stringify({ error: "MISSING_PARAMS", message: "adId é obrigatório." }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const { data: deletedAd, error: deleteError } = await adminClient
                .from('anuncios')
                .delete()
                .eq('id', adId)
                .select();

            if (deleteError) throw deleteError;

            if (!deletedAd || deletedAd.length === 0) {
                console.warn(`[${FUNCTION_NAME}] Anúncio ${adId} não encontrado ou já deletado.`);
            }

            if (reportId) {
                await adminClient.from('reports').update({ status: 'resolved' }).eq('id', reportId);
            }

            logAdminAction(FUNCTION_NAME, 'delete_ad', adminId, adId, true, {
                relatedReportId: reportId ?? null,
                deletedCount: deletedAd?.length ?? 0,
            });

            return new Response(JSON.stringify({
                success: true,
                deletedCount: deletedAd?.length ?? 0,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({
            error: "INVALID_ACTION",
            message: `Ação desconhecida: ${action}`
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (err) {
        console.error(`[${FUNCTION_NAME}] Unhandled exception:`, err);
        return new Response(JSON.stringify({
            error: "INTERNAL_ERROR",
            message: err instanceof Error ? err.message : String(err),
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
