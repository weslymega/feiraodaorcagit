import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

serve(async (req) => {
    try {
        const body = await req.json();
        const paymentId = body.data?.id;

        if (!paymentId) {
            return new Response("Invalid webhook", { status: 400 });
        }

        // 🔎 Validar pagamento no Mercado Pago
        const mpRes = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${MP_ACCESS_TOKEN}`
                }
            }
        );

        const payment = await mpRes.json();

        if (payment.status !== "approved") {
            return new Response("Payment not approved", { status: 200 });
        }

        const { user_id, plan_type } = payment.metadata;

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // ✅ Atualizar plano
        await supabase.from("profiles").update({
            active_plan: plan_type,
            plan_expires_at: expiresAt.toISOString()
        }).eq("id", user_id);

        // 💾 Registrar pagamento
        await supabase.from("payments").insert({
            user_id,
            mp_payment_id: payment.id,
            status: payment.status,
            amount: payment.transaction_amount,
            plan_type
        });

        return new Response("OK", { status: 200 });

    } catch (err) {
        return new Response(
            JSON.stringify({ error: "WEBHOOK_ERROR", detail: String(err) }),
            { status: 500 }
        );
    }
});
