
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
    console.log("🔍 Verificando triggers na tabela messages...");
    
    // In Supabase, we can't always run arbitrary SQL via rpc if not configured,
    // but we can try to see if there are any hints in the table structure or just use a test insert.
    
    const { data, error } = await supabase.rpc('get_table_triggers', { table_name: 'messages' });
    
    if (error) {
        console.log("❌ Erro ao buscar triggers via RPC (provavelmente a function não existe):", error.message);
        console.log("Tentando via query direta...");
        
        // Note: Direct query to pg_trigger might be blocked by RLS if not using service role,
        // but here we are using service role.
        // However, PostgREST doesn't expose pg_catalog by default.
    } else {
        console.log("✅ Triggers encontrados:", data);
    }
}

checkTriggers();
