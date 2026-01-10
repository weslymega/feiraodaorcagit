import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response("Unauthorized", { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabase.auth.getUser(token);
        const user = userData.user;

        if (!user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await req.json();

        // 🔍 Buscar plano do usuário
        const { data: profile } = await supabase
            .from("profiles")
            .select("active_plan")
            .eq("id", user.id)
            .single();

        const activePlan = profile?.active_plan ?? "free";

        // 📆 Início do mês atual
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // 🔢 Contar anúncios do mês
        const { count } = await supabase
            .from("ads")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", startOfMonth.toISOString())
            .neq("status", "rejected");

        if (activePlan === "free" && (count ?? 0) >= 3) {
            return new Response(
                JSON.stringify({
                    error: "LIMIT_REACHED",
                    message: "Limite mensal de anúncios do plano gratuito atingido."
                }),
                { status: 403 }
            );
        }

        // ✅ Criar anúncio
        const { data: ad, error } = await supabase.from("ads").insert({
            user_id: user.id,
            title: body.title,
            description: body.description,
            price: body.price,
            category: body.category,
            status: "pending"
        }).select().single();

        if (error) throw error;

        return new Response(JSON.stringify(ad), { status: 200 });

    } catch (err) {
        return new Response(
            JSON.stringify({ error: "INTERNAL_ERROR", detail: String(err) }),
            { status: 500 }
        );
    }
});
