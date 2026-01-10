import { serve } from "https://deno.land/std/http/server.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

serve(async (req) => {
    try {
        const { plan_type, user_id } = await req.json();

        const preference = {
            items: [
                {
                    title: `Plano ${plan_type.toUpperCase()} - Feirão da Orca`,
                    quantity: 1,
                    currency_id: "BRL",
                    unit_price: plan_type === "basic" ? 29.9 :
                        plan_type === "advanced" ? 59.9 : 99.9
                }
            ],
            metadata: {
                user_id,
                plan_type
            },
            back_urls: {
                success: "https://feiraodaorca.store/sucesso",
                failure: "https://feiraodaorca.store/erro"
            },
            auto_return: "approved"
        };

        const response = await fetch(
            "https://api.mercadopago.com/checkout/preferences",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(preference)
            }
        );

        const data = await response.json();

        return new Response(
            JSON.stringify({ init_point: data.init_point }),
            { status: 200 }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ error: "MP_ERROR", detail: String(err) }),
            { status: 500 }
        );
    }
});
