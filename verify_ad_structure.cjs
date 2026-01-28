const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
    console.log("🕵️‍♂️ Checking highlight tables...");

    const { count: countOld, error: errorOld } = await supabase
        .from('ad_highlights')
        .select('*', { count: 'exact', head: true });

    const { count: countNew, error: errorNew } = await supabase
        .from('destaques_anuncios')
        .select('*', { count: 'exact', head: true });

    console.log("--- TABLE CHECK ---");
    console.log("1. ad_highlights:", errorOld ? `Error: ${errorOld.message}` : `Exists (Count: ${countOld})`);
    console.log("2. destaques_anuncios:", errorNew ? `Error: ${errorNew.message}` : `Exists (Count: ${countNew})`);

    // Also check logs/payments just in case
    const { count: countPay, error: errorPay } = await supabase
        .from('pagamentos_destaque')
        .select('*', { count: 'exact', head: true });
    console.log("3. pagamentos_destaque:", errorPay ? `Error: ${errorPay.message}` : `Exists (Count: ${countPay})`);
}

checkTables();
