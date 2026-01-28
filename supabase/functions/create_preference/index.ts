
// DEPRECATED ENDPOINT
// This endpoint has been replaced by 'create-highlight-payment' which uses correct validation and database-driven pricing.

import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
    return new Response(
        JSON.stringify({
            error: "Gone",
            message: "This endpoint is deprecated. Update your app to use the new payment flow (v2)."
        }),
        {
            status: 410,
            headers: { "Content-Type": "application/json" }
        }
    );
});
