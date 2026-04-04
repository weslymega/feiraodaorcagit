const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 1. Load credentials from .env
let SUPABASE_URL, SUPABASE_ANON_KEY;
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            const k = key.trim();
            const v = value.trim();
            if (k === 'VITE_SUPABASE_URL') SUPABASE_URL = v;
            if (k === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = v;
            // Fallback for non-VITE names
            if (k === 'SUPABASE_URL' && !SUPABASE_URL) SUPABASE_URL = v;
            if (k === 'SUPABASE_ANON_KEY' && !SUPABASE_ANON_KEY) SUPABASE_ANON_KEY = v;
        }
    });
} catch (e) {
    console.error("Error reading .env:", e.message);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
    console.log("🕵️ Auditoria de Dados Sensíveis iniciada...");
    console.log(`URL: ${SUPABASE_URL}\n`);

    // 1. Teste de Leitura Geral (Vazamento de Lista)
    console.log("--- TESTE 1: Leitura Geral (Vazamento de Massa) ---");
    const { data: allProfiles, error: errAll } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

    if (errAll) {
        console.log(`✅ BLOQUEADO: Erro de RLS ao tentar ler todos: ${errAll.message}\n`);
    } else {
        console.warn(`❌ VAZAMENTO DETECTADO: Conseguimos ler ${allProfiles.length} perfis aleatórios.`);
        console.warn("Colunas vazadas:", Object.keys(allProfiles[0]).join(', '));
        
        // Verificar se vazou campos sensíveis
        const sensitive = ['email', 'is_admin', 'role', 'is_blocked', 'active_plan'];
        const leaked = sensitive.filter(s => allProfiles[0].hasOwnProperty(s));
        
        if (leaked.length > 0) {
            console.error(`🔴 CRÍTICO: Dados sensíveis expostos publicamente: ${leaked.join(', ')}`);
        }
        console.log("\n");
    }

    // 2. Teste de Leitura de ID Específico (Vazamento por Alvo)
    // Tentaremos ler o perfil do admin (se soubermos o ID, ou um ID genérico)
    // Mas o teste 1 já é o mais grave.
}

runAudit();
