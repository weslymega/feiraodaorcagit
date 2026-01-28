import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // 1. Create a client with the user's focus for validation
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: req.headers.get('Authorization')! } }
        });

        // 2. Create an admin client for service-role actions
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: { user }, error: authError } = await userClient.auth.getUser();

        if (authError || !user) {
            console.error('[CreateAd] Auth validation failed:', authError);
            return new Response(JSON.stringify({
                error: "Unauthorized",
                message: "Invalid JWT or session expired",
                details: authError
            }), { status: 401, headers: corsHeaders });
        }

        const body = await req.json();
        console.log(`[CreateAd] Request from user ${user.id}`);

        // 🔍 Buscar plano do usuário (using adminClient)
        const { data: profile } = await adminClient
            .from("profiles")
            .select("active_plan")
            .eq("id", user.id)
            .single();

        const activePlan = profile?.active_plan ?? "free";

        // 🔢 Contar anúncios do mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await adminClient
            .from("anuncios")
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
                { status: 403, headers: corsHeaders }
            );
        }

        // ✅ Extração robusta de dados
        const titulo = body.titulo || body.title || 'Anúncio sem título';
        const imagens = (body.imagens && body.imagens.length > 0)
            ? body.imagens
            : (body.images && body.images.length > 0)
                ? body.images
                : (body.image ? [body.image] : []);

        const { data: ad, error } = await adminClient.from("anuncios").insert({
            user_id: user.id,
            titulo: titulo,
            descricao: body.descricao || body.description || '',
            preco: body.preco || body.price || 0,
            categoria: body.categoria || body.category,
            status: "pending",
            imagens: imagens,
            localizacao: body.localizacao || body.location || '',
            detalhes: body.detalhes || {
                year: body.year,
                mileage: body.mileage,
                vehicleType: body.vehicleType
            },
            boost_plan: body.boostPlan || 'gratis'
        }).select().single();

        if (error) throw error;

        return new Response(JSON.stringify(ad), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[CreateAd] Internal Error:', err);
        return new Response(
            JSON.stringify({ error: "INTERNAL_ERROR", detail: String(err) }),
            { status: 500, headers: corsHeaders }
        );
    }
});
