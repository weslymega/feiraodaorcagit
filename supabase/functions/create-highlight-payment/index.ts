import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get user from auth header
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        const { ad_id, plan_id, payment_data } = await req.json();

        // 1. Validate Ad Ownership
        const { data: ad, error: adError } = await supabase
            .from('ads')
            .select('user_id, title')
            .eq('id', ad_id)
            .single();

        if (adError || !ad || ad.user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Ad not found or not owned by user' }), { status: 403, headers: corsHeaders });
        }

        // 2. Validate Plan
        const { data: plan, error: planError } = await supabase
            .from('highlight_plans')
            .select('*')
            .eq('id', plan_id)
            .eq('active', true)
            .single();

        if (planError || !plan) {
            return new Response(JSON.stringify({ error: 'Invalid or inactive plan' }), { status: 400, headers: corsHeaders });
        }

        // 3. Prepare Mercado Pago Payment
        // Payment Brick sends data that should be mapped to the MP Payment API
        const mpPaymentBody = {
            transaction_amount: plan.price,
            description: `Destaque ${plan.name} - ${ad.title}`,
            payment_method_id: payment_data.payment_method_id,
            payer: {
                email: user.email,
                identification: payment_data.payer?.identification,
                first_name: payment_data.payer?.first_name || user.user_metadata?.name || 'Cliente',
                last_name: payment_data.payer?.last_name || '',
            },
            metadata: {
                user_id: user.id,
                ad_id: ad_id,
                plan_id: plan_id,
                type: 'highlight_purchase'
            },
            // For card payments, token is required
            token: payment_data.token,
            // For installments
            installments: payment_data.installments || 1,
            // Point of interaction for PIX
            point_of_interaction: payment_data.payment_method_id === 'pix' ? {
                type: "CHECKOUT",
                sub_type: "MERCHANT_USER"
            } : undefined,
            notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook-highlight`
        };

        const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": `pay_${ad_id}_${plan_id}_${Date.now()}`
            },
            body: JSON.stringify(mpPaymentBody)
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('MP Error:', mpData);
            return new Response(JSON.stringify({ error: 'Mercado Pago error', details: mpData }), { status: 400, headers: corsHeaders });
        }

        // Return the payment data (including QR code if PIX)
        return new Response(JSON.stringify(mpData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Task Error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), { status: 500, headers: corsHeaders });
    }
});
