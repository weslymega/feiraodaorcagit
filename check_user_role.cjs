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

async function checkSpecificUser() {
    const targetId = '2b06b852-ec00-4232-b258-689d11dd1085';
    console.log(`🕵️‍♂️ Checking User ID: ${targetId}`);

    const { data, error } = await supabase
        .from('profiles')
        .select('email, role, is_admin')
        .eq('id', targetId)
        .single();

    if (error) {
        console.error("❌ Error fetching user:", error.message);
    } else {
        console.log("👤 User Info:", data);
    }
}

checkSpecificUser();
