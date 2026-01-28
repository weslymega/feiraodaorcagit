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
} catch (e) { }

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugTables() {
    console.log("🕵️‍♂️ Checking Payment Tables...");

    const tables = ['pagamentos_destaque', 'payments', 'ad_highlights'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ Table '${table}': NOT FOUND or error: ${error.message}`);
        } else {
            console.log(`✅ Table '${table}': FOUND, Count: ${count}`);

            // If it exists, check unique statuses
            const { data } = await supabase.from(table).select('status').limit(10);
            if (data) {
                const statuses = [...new Set(data.map(d => d.status))];
                console.log(`   - Sample statuses in '${table}':`, statuses);
            }
        }
    }
}

debugTables();
