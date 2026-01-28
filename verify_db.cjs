const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testExactInsert() {
    console.log("🧪 Testando inserção COM COLUNAS NOVAS...");

    // Payload idêntico ao do api.ts
    const testData = {
        reporter_id: '00000000-0000-0000-0000-000000000001',
        ad_id: 'c4', // Mock ID (Texto)
        target_id: 'c4',
        target_type: 'ad',
        target_name: 'Teste de Colunas', // Nova coluna
        target_image: 'https://placeholder.com', // Nova coluna
        reported_user_id: null,
        reason: 'Teste de Schema',
        description: 'Verificando se o usuário rodou o SQL novo.',
        severity: 'medium',
        status: 'pending'
    };

    const { data, error } = await supabase.from('reports').insert(testData);

    if (error) {
        console.error("❌ ERRO DETALHADO:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Insert funcionou! O banco está atualizado.");
    }
}

testExactInsert();
