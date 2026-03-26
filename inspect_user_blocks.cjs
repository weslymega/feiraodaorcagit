const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env directly to get VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
let SUPABASE_URL, SUPABASE_ANON_KEY;

try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.trim();
        }
    });
} catch (e) {
    console.error("❌ Error loading .env:", e.message);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ SUPABASE_URL or ANON_KEY not found in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectUserBlocks() {
    console.log("🕵️‍♂️ Inspecting 'user_blocks' table...");

    // Try to fetch one row
    const { data, error } = await supabase
        .from('user_blocks')
        .select('*')
        .limit(1);

    if (error) {
        console.log("❌ Error/Table not found:", error.message);
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
            console.log("👉 CONFIRMED: Table 'user_blocks' does not exist or is not accessible.");
        }
        return;
    }

    console.log("✅ Success! Table 'user_blocks' exists.");
    if (data && data.length > 0) {
        console.log("📊 Record structure:", Object.keys(data[0]));
    } else {
        console.log("ℹ️ Table is empty, but exists.");
        // Try to insert a dummy (will fail if RLS is on and no session, but we just want to see error)
        const { error: insertError } = await supabase.from('user_blocks').insert({ blocker_id: '00000000-0000-0000-0000-000000000000', blocked_id: '00000000-0000-0000-0000-000000000000' });
        console.log("ℹ️ Insert test error (expected if RLS on):", insertError?.message);
    }
}

inspectUserBlocks();
