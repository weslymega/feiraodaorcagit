const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env from ROOT
const envPath = path.resolve(__dirname, '../../../.env');
const envData = fs.readFileSync(envPath, 'utf8');
const env = {};
envData.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
// Note: We need a SERVICE_ROLE_KEY to run RPCs or ALTER tables.
// If it's not in .env, we'll try to find it in the environment.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyFix() {
    console.log('--- Applying Minimal Avatar Fix ---');
    
    const sql = `
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS avatar_id TEXT;
        
        NOTIFY pgrst, 'reload schema';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Error applying fix:', error.message);
        console.log('\n--- MANUAL ACTION REQUIRED ---');
        console.log('Please execute the following SQL in your Supabase Dashboard:');
        console.log(sql);
    } else {
        console.log('✅ Fix applied successfully!');
    }
}

applyFix();
