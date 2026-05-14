
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Look for .env in current or parent directories
function findEnv() {
    let curr = __dirname;
    while (curr.length > 5) {
        const p = path.join(curr, '.env');
        if (fs.existsSync(p)) return p;
        curr = path.dirname(curr);
    }
    return null;
}

const envPath = findEnv();
if (!envPath) {
    console.error("❌ .env não encontrado!");
    process.exit(1);
}

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
    
    try {
        const { data, error } = await supabase.rpc('get_table_triggers', { table_name: 'messages' });
        if (error) throw error;
        console.log("✅ Triggers encontrados:", data);
    } catch (e) {
        console.log("❌ Erro ao buscar triggers (Normal se a function rpc 'get_table_triggers' não existir).");
        
        // Vamos tentar inserir uma mensagem e ver se há algum erro de trigger
        console.log("Injetando mensagem de teste para verificar resposta do banco...");
        const { error: insError } = await supabase.from('messages').insert({
            sender_id: 'a6fd5065-2fe4-4fb3-adb5-36ad477dbd7b',
            receiver_id: '3e503cc0-d8bc-429e-9781-8c009da8ee97',
            content: 'Teste de Trigger ' + new Date().toISOString(),
            ad_id: 'd9e503cc-d8bc-429e-9781-8c009da8ee97' // Dummy ID
        });
        
        if (insError) {
            console.log("⚠️ Erro na inserção (pode ser restrição de ad_id ou RLS):", insError.message);
        } else {
            console.log("✅ Inserção concluída. Se não chegou push, o trigger/webhook não está disparando.");
        }
    }
}

checkTriggers();
