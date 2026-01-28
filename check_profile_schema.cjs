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

async function checkProfileSchema() {
    console.log("🕵️‍♂️ Checking schema for 'profiles'...");

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error("❌ Error fetching profile:", error.message);
        return;
    }

    console.log("\n📊 COLUMNS DETECTED IN PROFILES:");
    const columns = Object.keys(data);
    columns.forEach(col => {
        console.log(`- ${col}: ${typeof data[col]}`);
    });
}

checkProfileSchema();
