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

async function checkSchema() {
    console.log("🕵️‍♂️ Checking schema for 'anuncios'...");

    // We can't directly query pg_attribute without more permissions usually,
    // but we can try to get one record and check the types via meta or just trust previous debug.
    // Let's try to get columns via an RPC if available or just list keys from a record.

    const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error("❌ Error fetching ad:", error.message);
        return;
    }

    console.log("\n📊 COLUMNS DETECTED:");
    const columns = Object.keys(data);
    columns.forEach(col => {
        console.log(`- ${col}: ${typeof data[col]} ${Array.isArray(data[col]) ? '(Array)' : ''}`);
    });

}

checkSchema();
