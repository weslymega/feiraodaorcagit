const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env
let SUPABASE_URL, SUPABASE_ANON_KEY;

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.trim();
        }
    });
} catch (e) {
    console.log("⚠️ Could not read .env file, trying process.env");
}

if (!SUPABASE_URL) SUPABASE_URL = process.env.VITE_SUPABASE_URL;
if (!SUPABASE_ANON_KEY) SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing Supabase credentials. Ensure .env exists or vars are set.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkLastAd() {
    console.log("🕵️‍♂️ Fetching last created ad...");

    const { data: ads, error } = await supabase
        .from('anuncios')
        .select('id, titulo, imagens, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error fetching ads:", error.message);
        return;
    }

    console.log("\n📊 RECENT ADS:");
    ads.forEach((ad, i) => {
        console.log(`\nAd #${i + 1}:`);
        console.log("ID:", ad.id);
        console.log("Titulo:", ad.titulo);
        console.log("Status:", ad.status);
        console.log("Created At:", ad.created_at);
        console.log("Imagens:", JSON.stringify(ad.imagens));
    });
}

checkLastAd();
