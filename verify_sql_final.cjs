
const { createClient } = require('@supabase/supabase-js');

// Manual env load if needed, but usually process.env has them if I run via npm or similar
// For simplicity, I'll use the values I saw in the conversation or just try to rely on the environment
const supabaseUrl = "https://be98cdc5114545228aaa.supabase.co"; // Based on earlier logs / project ref
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

async function verify() {
    if (!anonKey) {
        console.error("VITE_SUPABASE_ANON_KEY is missing from environment.");
        return;
    }

    const supabase = createClient(supabaseUrl, anonKey);

    console.log("--- 1. Testing ads_ranked availability ---");
    const { data: ads, error: adsError } = await supabase
        .from('ads_ranked')
        .select('id, owner_name')
        .limit(1);

    if (adsError) {
        console.log("❌ ads_ranked check failed:", adsError.message);
    } else {
        console.log("✅ ads_ranked is accessible and has owner_name:", !!ads?.[0]?.owner_name);
    }

    console.log("--- 2. Testing get_feed RPC ---");
    const { data: feed, error: feedError } = await supabase.rpc('get_feed', { limit_count: 1 });

    if (feedError) {
        console.log("❌ get_feed RPC failed:", feedError.message);
    } else {
        console.log("✅ get_feed RPC is accessible.");
        if (feed && feed.length > 0) {
            console.log("Feed Profiles Sample:", JSON.stringify(feed[0].profiles));
        }
    }
}

verify();
