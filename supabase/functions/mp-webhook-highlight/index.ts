import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
};

// Validates MercadoPago "x-signature" header
async function validateSignature(xSignature: string, xRequestId: string, dataID: string, secret: string) {
    try {
        // x-signature format: ts=123456,v1=abcdef...
        const parts = xSignature.split(',');
        let ts = '';
        let hash = '';

        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key === 'ts') ts = value;
            if (key === 'v1') hash = value;
        });

        if (!ts || !hash) return false;

        const manifest = `id:${dataID};request-id:${xRequestId};ts:${ts};`;

        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            enc.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign(
            "HMAC",
            key,
            enc.encode(manifest)
        );

        const signatureHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return signatureHex === hash;
    } catch (e) {
        console.error('Signature validation error:', e);
        return false;
    }
}

Deno.serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!;
    const mpWebhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')!;

    // Use Service Role for admin access to tables
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // LOGGING HELPER
    // Logs to both Console and DB 'payment_events'
    const logEvent = async (eventType: string, paymentId: string | null, payload: any, errorMsg?: string) => {
        console.log(`[${eventType}]`, errorMsg || 'Success', paymentId || 'No ID');

        // Non-blocking DB insert for logs
        try {
            await supabase.from('payment_events').insert({
                payment_id: paymentId,
                event_type: eventType,
                payload: payload,
                error_message: errorMsg
            });
        } catch (err) {
            console.error('Failed to write to payment_events', err);
        }
    };

    try {
        const url = new URL(req.url);
        const method = req.method;

        // READ HEADERS & PAYLOAD
        const xSignature = req.headers.get('x-signature');
        const xRequestId = req.headers.get('x-request-id');
        const rawBody = await req.text(); // Get text for potential signature checks if needed differently, but MP checks ID.
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return new Response('Invalid JSON', { status: 400 });
        }

        const { action, type, data } = body;
        const paymentId = (data?.id || body?.data?.id) as string;

        // Log raw webhook arrival
        await logEvent('webhook.received', paymentId, { headers: Object.fromEntries(req.headers), body }, null);

        // 1. SECURITY: VALIDATE SIGNATURE
        if (!xSignature || !xRequestId || !paymentId) {
            // If critical headers missing, log and request ignore (200 OK to stop retries if it's junk)
            await logEvent('webhook.ignored', paymentId, {}, 'Missing signature/ID headers');
            return new Response(JSON.stringify({ message: 'Ignored' }), { status: 200, headers: corsHeaders });
        }

        const isValid = await validateSignature(xSignature, xRequestId, paymentId, mpWebhookSecret);

        if (!isValid) {
            await logEvent('security.signature_failed', paymentId, { xSignature }, 'Invalid HMAC Signature');
            // Return 200 to 'acknowledge' but do NOT process, so MP stops sending malicious logic
            return new Response(JSON.stringify({ message: 'Invalid Signature' }), { status: 200, headers: corsHeaders });
        }

        // 2. CHECK EVENT TYPE
        // We only care about proper payment updates.
        // 'payment' is the object type usually. Action can be payment.created or payment.updated
        if (type !== 'payment' && action !== 'payment.created' && action !== 'payment.updated') {
            // Just log and ignore other topics
            return new Response(JSON.stringify({ message: 'Ignored topic' }), { status: 200, headers: corsHeaders });
        }

        // 3. FETCH TRUSTED DATA (GET /v1/payments/{id})
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${mpAccessToken}`
            }
        });

        if (!mpResponse.ok) {
            const errorData = await mpResponse.json();
            await logEvent('mp.fetch_failed', paymentId, errorData, `Failed to fetch payment: ${mpResponse.status}`);
            return new Response(JSON.stringify({ message: 'MP Fetch Error' }), { status: 200, headers: corsHeaders });
        }

        const paymentData = await mpResponse.json();
        const currentStatus = paymentData.status; // approved, pending, rejected, etc.
        const mpMetadata = paymentData.metadata || {};

        // Extract Internal ID from External Reference (Primary reliability)
        const externalRef = paymentData.external_reference;
        let resolvedInternalId = mpMetadata.internal_payment_id;

        if (externalRef && typeof externalRef === 'string' && externalRef.startsWith('FO-HIGHLIGHT-')) {
            const extractedId = externalRef.split('FO-HIGHLIGHT-')[1];
            // Basic UUID validation could be added here if needed, but for now we trust the prefix.
            if (extractedId) {
                resolvedInternalId = extractedId;
            }
        }

        await logEvent('webhook.processing', paymentId, { status: currentStatus, internal_id: resolvedInternalId, ext_ref: externalRef }, null);

        // 4. DATABASE UPDATES

        // A. Update 'pagamentos_destaque'
        // Search by MERCADO_PAGO_ID (primary) OR Internal ID (fallback)
        // We prioritize matching by MP ID (if we already saved it), otherwise we find by our Internal ID.
        let searchFilter = `mercado_pago_payment_id.eq.${paymentId}`;
        if (resolvedInternalId) {
            searchFilter += `,id.eq.${resolvedInternalId}`;
        }

        let { data: internalPayment, error: searchError } = await supabase
            .from('pagamentos_destaque')
            .select('*')
            .or(searchFilter)
            .single();

        if (searchError || !internalPayment) {
            // If record not found, CREATE IT (Safe Fallback)
            // This handles cases where our 'create-highlight-payment' failed to save MP ID
            // or if manual payment was created externally (shouldn't happen but good defense)
            if (internalPaymentId) {
                // Try to find purely by ID if the OR failed (unlikely)
                // But if we are here, we might need to rely on metadata to link to user/ad
            }

            // Critical: If we don't have user_id/ad_id/plan_id in metadata, we can't create reliable records.
            // But we DO put them in metadata in 'create-highlight-payment'.

            if (mpMetadata.user_id && mpMetadata.ad_id && mpMetadata.plan_id) {
                const { data: newRec, error: createError } = await supabase
                    .from('pagamentos_destaque')
                    .upsert({
                        mercado_pago_payment_id: paymentId,
                        anuncio_id: mpMetadata.ad_id,
                        plano_id: mpMetadata.plan_id,
                        usuario_id: mpMetadata.user_id,
                        status: currentStatus,
                        status_detail: paymentData.status_detail,
                        valor: paymentData.transaction_amount,
                        metadata: paymentData
                    }, { onConflict: 'mercado_pago_payment_id' })
                    .select()
                    .single();

                if (createError) {
                    await logEvent('db.upsert_failed', paymentId, createError, 'Failed to upsert payment record');
                    return new Response(JSON.stringify({ message: 'DB Error' }), { status: 200, headers: corsHeaders });
                }
                internalPayment = newRec;
            } else {
                await logEvent('data.missing_metadata', paymentId, mpMetadata, 'Cannot reconcile payment without metadata');
                return new Response(JSON.stringify({ message: 'Missing Metadata' }), { status: 200, headers: corsHeaders });
            }
        } else {
            // Update existing
            const { error: updateError } = await supabase
                .from('pagamentos_destaque')
                .update({
                    status: currentStatus,
                    status_detail: paymentData.status_detail,
                    mercado_pago_payment_id: paymentId, // Ensure this is set if it was NULL (pending)
                    updated_at: new Date().toISOString()
                })
                .eq('id', internalPayment.id);

            if (updateError) {
                await logEvent('db.update_failed', paymentId, updateError, 'Failed to update payment status');
            }
        }

        // A2. Idempotency Check
        // If we just processed this and it IS approved, check if we already gave the highlight.
        if (currentStatus === 'approved') {
            const adId = internalPayment.anuncio_id;
            const planId = internalPayment.plano_id;

            // Check if ACTIVE highlight exists for this ad
            const { data: existingHighlight, error: highlightError } = await supabase
                .from('destaques_anuncios')
                .select('*')
                .eq('anuncio_id', adId)
                .eq('status', 'active')
                .single();

            if (existingHighlight) {
                await logEvent('business.idempotency_hit', paymentId, { ad_id: adId }, 'Active highlight already exists. Skipping creation.');
                return new Response(JSON.stringify({ message: 'Already Active' }), { status: 200, headers: corsHeaders });
            }

            // B. Activate Highlight (Create new record)
            // Duration: 7 days default
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + 7);

            const { error: insertHighlightError } = await supabase
                .from('destaques_anuncios')
                .insert({
                    anuncio_id: adId,
                    payment_id: internalPayment.id,
                    plano_id: planId,
                    status: 'active',
                    inicio_em: startDate.toISOString(),
                    fim_em: endDate.toISOString()
                });

            if (insertHighlightError) {
                // Handle Unique Violation (Race condition)
                if (insertHighlightError.code === '23505') { // Postgres Unique Violation
                    await logEvent('business.race_condition', paymentId, { ad_id: adId }, 'Race condition caught on highlight creation via DB Constraint');
                } else {
                    await logEvent('db.highlight_failed', paymentId, insertHighlightError, 'Failed to create highlight record');
                }
            } else {
                await logEvent('business.highlight_activated', paymentId, { ad_id: adId, end: endDate }, 'Highlight successfully activated');
            }
        }

        return new Response(JSON.stringify({ message: 'Processed' }), { status: 200, headers: corsHeaders });

    } catch (err) {
        // SECURITY: GLOBAL CATCH, NEVER 500
        console.error('Unhandled Webhook Error:', err);
        // Try to log blindly
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from('payment_events').insert({
            event_type: 'system.panic',
            error_message: String(err)
        });

        return new Response(JSON.stringify({ message: 'Internal Error Handled' }), { status: 200, headers: corsHeaders });
    }
});
