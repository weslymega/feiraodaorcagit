const fs = require('fs');
const path = require('path');

const findEnv = () => {
    let currentPath = __dirname;
    while (currentPath !== path.parse(currentPath).root) {
        const envPath = path.join(currentPath, '.env');
        if (fs.existsSync(envPath)) return envPath;
        const envPathUp = path.join(path.dirname(currentPath), '.env');
        if (fs.existsSync(envPathUp)) return envPathUp;
        currentPath = path.dirname(currentPath);
    }
    return null;
};

const envPath = findEnv();
if (!envPath) {
    console.error("Erro: Arquivo .env não encontrado.");
    process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf-8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const supabaseKey = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

const TARGET_USER_ID = 'e13e0888-3b87-46e0-b772-1be65409ab88';

async function testPush() {
    console.log(`--- TESTE DE PUSH PARA USUÁRIO ESPECÍFICO: ${TARGET_USER_ID} ---`);
    
    const functionUrl = `${supabaseUrl}/functions/v1/send_push_notification`;
    const payload = {
        type: 'INSERT',
        table: 'messages',
        record: {
            receiver_id: TARGET_USER_ID,
            sender_id: '3e503cc0-d8bc-429e-9781-8c009da8ee97', // ID do remetente real (Wesly?)
            content: "🚀 Teste de Depuração de Notificação!",
            ad_id: "2a7a4b4c-134c-4419-ba6f-e20569dd5ace"
        }
    };

    console.log("🚀 Chamando Edge Function...");
    const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(payload)
    });

    const result = await res.json();
    
    if (res.ok) {
        console.log("\n🎉 SUCESSO NA CHAMADA!");
        console.log("Resposta da Função:", JSON.stringify(result, null, 2));
    } else {
        console.error("\n❌ ERRO ao chamar Edge Function:");
        console.log(JSON.stringify(result, null, 2));
    }
}

testPush();
