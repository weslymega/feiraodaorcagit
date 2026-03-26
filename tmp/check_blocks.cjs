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

async function checkBlocksTable() {
    console.log("🕵️‍♂️ Checking for 'user_blocks' or 'bloqueios' table...");

    const { error: error1 } = await supabase.from('user_blocks').select('*').limit(1);
    const { error: error2 } = await supabase.from('bloqueios').select('*').limit(1);

    if (error1 && error1.code !== 'PGRST116') {
        console.log("❌ 'user_blocks' table does not exist or error:", error1.message);
    } else {
        console.log("✅ 'user_blocks' table exists!");
    }

    if (error2 && error2.code !== 'PGRST116') {
        console.log("❌ 'bloqueios' table does not exist or error:", error2.message);
    } else {
        console.log("✅ 'bloqueios' table exists!");
    }
}

checkBlocksTable();
