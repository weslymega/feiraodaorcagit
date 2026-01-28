import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentPayload {
    ad_id: string;
    plan_id: string;
    payment_data: {
        payment_method_id: string;
        token?: string;
        issuer_id?: string;
        installments?: number;
        payer?: {
            email: string;
            identification?: {
                type: string;
                number: string;
            };
            first_name?: string;
            last_name?: string;
        };
    };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const requestId = crypto.randomUUID();
    const log = (event: string, data: any = {}, level: 'info' | 'error' | 'warn' = 'info') => {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            request_id: requestId,
            level,
            event,
            ...data
        }));
    };

    try {
        log('start_request', { method: req.method });

        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

        // 1. Validation: Authorization Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            log('auth_error', { error: 'Missing Authorization header' }, 'error');
            return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
        }

        // Extract JWT token from "Bearer <token>" format
        const token = authHeader.replace('Bearer ', '');

        // Use Service Role client to validate the JWT
        // This is the recommended approach for Edge Functions
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

        if (authError || !user) {
            log('auth_failed', {
                error: authError?.message || 'Unknown error',
                hasToken: !!token,
                tokenLength: token?.length
            }, 'error');
            return new Response(JSON.stringify({
                error: 'Unauthorized',
                message: 'Invalid or expired token',
                details: authError?.message
            }), { status: 401, headers: corsHeaders });
        }

        log('auth_success', { user_id: user.id }, 'info');

        let body: PaymentPayload;
        try {
            body = await req.json();
        } catch (e) {
            log('payload_error', { error: 'Invalid JSON' }, 'error');
            return new Response(JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
        }

        const { ad_id, plan_id, payment_data } = body;

        // 2. Business Logic: Validate Ad & Plan (Using Admin Client for trusted read)
        // adminClient already created above for auth validation


        // Check Ad Ownership
        const { data: ad, error: adError } = await adminClient
            .from('anuncios')
            .select('user_id, titulo')
            .eq('id', ad_id)
            .single();

        if (adError || !ad) {
            log('ad_lookup_failed', { ad_id, error: adError }, 'error');
            return new Response(JSON.stringify({ error: 'Ad not found' }), { status: 404, headers: corsHeaders });
        }

        if (ad.user_id !== user.id) {
            log('ad_ownership_mismatch', { ad_user: ad.user_id, request_user: user.id }, 'error');
            return new Response(JSON.stringify({ error: 'Forbidden', message: 'You do not own this ad' }), { status: 403, headers: corsHeaders });
        }

        // Check Plan Validity
        const { data: plan, error: planError } = await adminClient
            .from('highlight_plans')
            .select('*')
            .eq('id', plan_id)
            .eq('active', true)
            .single();

        if (planError || !plan) {
            log('plan_lookup_failed', { plan_id, error: planError }, 'error');
            return new Response(JSON.stringify({ error: 'Plan not found or inactive' }), { status: 400, headers: corsHeaders });
        }

        // 3. Create Pending Payment Record (CRITICAL STEP)
        // Ensure record exists BEFORE webhook
        const { data: pendingPayment, error: paymentError } = await adminClient
            .from('pagamentos_destaque')
            .insert({
                anuncio_id: ad_id,
                plano_id: plan_id,
                usuario_id: user.id,
                status: 'pending',
                valor: plan.price,
                metadata: {
                    ip: req.headers.get('x-forwarded-for'),
                    user_agent: req.headers.get('user-agent')
                }
            })
            .select('id') // Get back the UUID generated by database
            .single();

        if (paymentError || !pendingPayment) {
            log('db_insert_error', { error: paymentError }, 'error');
            return new Response(JSON.stringify({ error: 'Database Error', details: 'Failed to initialize payment record' }), { status: 500, headers: corsHeaders });
        }

        log('payment_record_initialized', { internal_id: pendingPayment.id });

        // 4. Prepare Mercado Pago Payment
        const idempotencyKey = `pay_${pendingPayment.id}_${Date.now()}`;

        const mpPaymentBody = {
            transaction_amount: Number(plan.price),
            description: `Destaque ${plan.name} - ${ad.titulo}`,
            payment_method_id: payment_data.payment_method_id,
            payer: {
                email: user.email,
                first_name: payment_data.payer?.first_name || user.user_metadata?.name || 'Cliente',
                last_name: payment_data.payer?.last_name || 'Feirão',
                identification: payment_data.payer?.identification
            },
            // Unique identifier for correlation
            external_reference: `FO-HIGHLIGHT-${pendingPayment.id}`,
            // Metadata for MP to return in webhook or GET /v1/payments/{id}
            metadata: {
                internal_payment_id: pendingPayment.id, // Link back to our DB
                user_id: user.id,
                ad_id: ad_id,
                plan_id: plan_id,
                env: 'production'
            },
            token: payment_data.token,
            issuer_id: payment_data.issuer_id,
            installments: payment_data.installments || 1,
            ...(payment_data.payment_method_id === 'pix' ? {
                date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            } : {}),
            notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook-highlight`
        };

        const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": idempotencyKey
            },
            body: JSON.stringify(mpPaymentBody)
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            log('mp_payment_failed', { status: mpResponse.status, error: mpData }, 'error');
            // Optimistically try to mark as failed in DB, but don't block response
            await adminClient.from('pagamentos_destaque').update({ status: 'failed', metadata: mpData }).eq('id', pendingPayment.id);
            return new Response(JSON.stringify({ error: 'Payment Gateway Error', details: mpData }), { status: 400, headers: corsHeaders });
        }

        log('payment_created', { mp_id: mpData.id, status: mpData.status });

        // 5. Update Payment Record with MP ID
        const { error: updateError } = await adminClient
            .from('pagamentos_destaque')
            .update({
                mercado_pago_payment_id: String(mpData.id), // Ensure it's string as per schema
                status: mpData.status,
                status_detail: mpData.status_detail,
                metadata: { ...mpData.metadata, mp_raw: mpData } // Store MP metadata + raw response if needed
            })
            .eq('id', pendingPayment.id);

        if (updateError) {
            log('db_update_error', { error: updateError, mp_id: mpData.id }, 'error');
            // This is critical but the payment exists in MP. The webhook should fix this eventually 
            // IF the webhook logic searches by internal_payment_id in metadata OR by mp_payment_id (which we failed to save here)
            // Actually, if we fail to save MP ID here, the webhook might have trouble finding the record by MP ID.
            // But we stored `internal_payment_id` in MP metadata. The webhook logic should try to extract that if possible.
        }

        return new Response(JSON.stringify({
            id: mpData.id,
            status: mpData.status,
            status_detail: mpData.status_detail,
            qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        log('internal_error', { error: String(err) }, 'error');
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: corsHeaders });
    }
});
