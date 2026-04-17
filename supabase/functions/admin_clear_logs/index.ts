import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { requireAdmin, logAdminAction } from "../_shared/requireAdmin.ts";

const FUNCTION_NAME = "admin_clear_logs";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Proteção contra múltiplas execuções simultâneas
let isProcessing = false;

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (isProcessing) {
        return new Response(
            JSON.stringify({ error: 'Operação em andamento, aguarde.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
    }

    isProcessing = true;

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing critical environment variables");
        }

        // ── STEP 1: Admin Auth Guard (backend is the ONLY source of truth) ──────
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const auth = await requireAdmin(req, adminClient, corsHeaders, FUNCTION_NAME);
        if (auth.error) return auth.response;

        const { adminId } = auth;

        // ── STEP 2: Clear Security Logs (History older than 7 days) ───────────
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 7);
        
        const { error: deleteError, count } = await adminClient
            .from('security_logs')
            .delete({ count: 'exact' })
            .lt('created_at', limitDate.toISOString());
            
        if (deleteError) {
            console.error(`[${FUNCTION_NAME}] Delete error:`, deleteError);
            return new Response(
                JSON.stringify({ error: 'Erro ao remover logs de segurança' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        // ── STEP 3: Audit Log (Console-based following project standard) ──────
        logAdminAction(FUNCTION_NAME, 'clear_security_logs', adminId, null, true, { 
            deleted_count: count,
            limit_date: limitDate.toISOString()
        });

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: `Varredura concluída. ${count || 0} logs antigos foram descartados.`,
                deleted: count 
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error(`[${FUNCTION_NAME}] Unhandled exception:`, error);
        return new Response(
            JSON.stringify({ 
                error: 'INTERNAL_ERROR',
                message: error.message || 'Erro interno do servidor' 
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    } finally {
        isProcessing = false;
    }
})

