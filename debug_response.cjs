const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Ler .env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDeleteResponse() {
    console.log("🕵️‍♂️ ID de teste: 'id_que_nao_existe_12345'");

    // Login for test
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin.com',
        password: 'admin'
    });

    if (loginError) {
        console.log("⚠️ Não foi possível logar automaticamente. Tentando sem auth (provavelmente falhará)...");
    } else {
        console.log("🔓 Logado como:", user.email);
    }

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    // Direct fetch to control headers better
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin_manage_reports`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'delete_ad',
            adId: 'id_que_nao_existe_12345'
        })
    });

    if (!response.ok) {
        console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error("📄 Resposta:", text);
    } else {
        const data = await response.json();
        console.log("✅ Resposta da Edge Function:");
        console.log(JSON.stringify(data, null, 2));

        if (data.deletedCount === 0) {
            console.log("👍 Comportamento esperado: deletedCount é 0 para ID inexistente.");
        } else if (data.deletedCount === undefined) {
            console.error("⚠️ PROBLEMA CRÍTICO: 'deletedCount' não veio na resposta! O deploy pode ter falhado.");
        } else {
            console.log("🤔 Estranho: deletedCount veio como", data.deletedCount);
        }
    }
}

testDeleteResponse();
