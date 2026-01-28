import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
    try {
        const body = await req.json();
        const paymentId = body.data?.id || body.resource?.split('/').pop();

        if (!paymentId || (body.type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated')) {
            return new Response("Ignored event", { status: 200 });
        }

        // 1. Fetch payment details from MP to verify authenticity and actual status
        const mpRes = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
            }
        );

        if (!mpRes.ok) {
            return new Response("Error fetching payment from MP", { status: 400 });
        }

        const payment = await mpRes.json();

        // 2. Filter for approved payments only
        if (payment.status !== "approved") {
            return new Response(`Payment status: ${payment.status}`, { status: 200 });
        }

        // 3. Extract metadata
        const { user_id, ad_id, plan_id, type } = payment.metadata;

        if (type !== 'highlight_purchase' || !ad_id || !plan_id) {
            return new Response("Not a highlight payment", { status: 200 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 4. Idempotency Check: Already processed?
        const { data: existingPayment } = await supabase
            .from("payments")
            .select("id")
            .eq("mp_payment_id", String(payment.id))
            .maybeSingle();

        if (existingPayment) {
            return new Response("Already processed", { status: 200 });
        }

        // 5. Get Plan Details
        const { data: plan } = await supabase
            .from("highlight_plans")
            .select("*")
            .eq("id", plan_id)
            .single();

        if (!plan) return new Response("Plan not found", { status: 400 });

        // 6. Handle Highlight Activation / Extension
        // Check if there's an active highlight for this ad
        const { data: currentHighlight } = await supabase
            .from("ad_highlights")
            .select("*")
            .eq("ad_id", ad_id)
            .eq("status", "active")
            .gt("ends_at", new Date().toISOString())
            .order("ends_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        let startsAt = new Date();
        let endsAt = new Date();

        if (currentHighlight) {
            // Extend existing highlight
            startsAt = new Date(currentHighlight.starts_at);
            endsAt = new Date(currentHighlight.ends_at);
            endsAt.setDate(endsAt.getDate() + plan.duration_days);

            await supabase
                .from("ad_highlights")
                .update({
                    ends_at: endsAt.toISOString(),
                    plan_id: plan_id // Update to latest plan if different? User rules say "Destaques do mesmo plano se acumulam"
                })
                .eq("id", currentHighlight.id);
        } else {
            // New highlight
            endsAt.setDate(endsAt.getDate() + plan.duration_days);

            await supabase
                .from("ad_highlights")
                .insert({
                    ad_id,
                    user_id,
                    plan_id,
                    starts_at: startsAt.toISOString(),
                    ends_at: endsAt.toISOString(),
                    status: 'active'
                });
        }

        // 7. Register Payment
        await supabase.from("payments").insert({
            user_id,
            ad_id,
            highlight_plan_id: plan_id,
            mp_payment_id: String(payment.id),
            status: payment.status,
            amount: payment.transaction_amount,
            payment_method: payment.payment_method_id,
            metadata: payment.metadata
        });

        // 8. Update Ad Status / Metadata if needed (optional)
        // For example, we could update a column in 'ads' table to signal it is featured
        await supabase.from("ads").update({
            boost_plan: plan.name.toLowerCase()
        }).eq("id", ad_id);

        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error('Webhook Error:', err);
        return new Response(String(err), { status: 500 });
    }
});
