const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE || "SEU_SERVICE_ROLE_KEY_AQUI_SE_TIVER"; // Preciso da chave de serviço para simular a Edge Function

// Como não tenho a Service Role Key aqui facilmente sem pedir pro user,
// Vou simular o comportamento chamando a função via API pública (se tiver anon key)

const supabase = createClient(SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function debugAdDeletion() {
    console.log("🕵️‍♂️ Iniciando Diagnóstico de Exclusão...");

    // 1. Listar TODOS os anúncios para ver se tem duplicatas
    const { data: ads, error } = await supabase.from('anuncios').select('id, titulo, user_id');

    if (error) {
        console.error("❌ Erro ao listar anúncios:", error.message);
        return;
    }

    console.log(`📋 Total de anúncios encontrados: ${ads.length}`);
    ads.forEach(ad => {
        console.log(`- [${ad.id}] ${ad.titulo} (User: ${ad.user_id})`);
    });

    console.log("\n⚠️ INSTRUÇÃO: Se você ver anúncios duplicados ou com IDs estranhos, esse é o problema.");
    console.log("   Tente pegar o ID de um anúncio que você quer deletar e rodar:");
    console.log("   node delete_test.cjs <AD_ID>");
}

const targetId = process.argv[2];

if (targetId) {
    console.log(`\n🧨 Tentando deletar anúncio ID: ${targetId}`);
    // Simular o que a Edge Function faz
    supabase.functions.invoke('admin_manage_reports', {
        body: { action: 'delete_ad', adId: targetId }
    }).then(({ data, error }) => {
        console.log("📨 Resposta da Edge Function:");
        if (error) console.error("❌ ERRO:", error);
        else console.log("✅ DADOS:", JSON.stringify(data, null, 2));
    });
} else {
    debugAdDeletion();
}
