const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Try both possible env paths
let envPath = '../../.env'; // Based on current list_dir showing nested depth
if (!fs.existsSync(envPath)) envPath = '.env';

let SUPABASE_URL, SUPABASE_ANON_KEY;
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            const k = key.trim();
            const v = value.trim();
            if (k === 'VITE_SUPABASE_URL' || k === 'SUPABASE_URL') SUPABASE_URL = v;
            if (k === 'VITE_SUPABASE_ANON_KEY' || k === 'SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = v;
        }
    });
} catch (e) {
    console.error("Error reading .env at", envPath, ":", e.message);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
    console.log("🕵 Auditoria de Dados Sensíveis iniciada...");
    console.log(`URL: ${SUPABASE_URL}\n`);

    const { data, error } = await supabase.from('profiles').select('*').limit(2);

    if (error) {
        console.log(`✅ BLOQUEADO: Erro de RLS ao tentar ler: ${error.message}\n`);
    } else if (data && data.length > 0) {
        console.warn(`❌ VAZAMENTO DETECTADO: Conseguimos ler ${data.length} perfis aleatórios.`);
        const cols = Object.keys(data[0]);
        console.log("Colunas vazadas:", cols.join(', '));
        
        const sensitive = ['email', 'is_admin', 'role', 'is_blocked', 'active_plan', 'phone', 'whatsapp'];
        const leaked = sensitive.filter(s => data[0].hasOwnProperty(s));
        
        if (leaked.length > 0) {
            console.error(`🔴 CRÍTICO: Dados sensíveis expostos publicamente: ${leaked.join(', ')}`);
            console.log("\nExemplo de registro vazado:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("✅ OK: Campos sensíveis parecem estar filtrados (embora a lista de nomes/IDs esteja vazada).");
        }
    } else {
        console.warn('⚠️ Nenhum perfil encontrado, mas a query foi bem-sucedida (sem erro de RLS).');
    }
}

runAudit();
