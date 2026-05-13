const fs = require('fs');
const path = require('path');

// Tenta carregar do .env na raiz do projeto
const findEnv = () => {
    let currentPath = __dirname;
    while (currentPath !== path.parse(currentPath).root) {
        const envPath = path.join(currentPath, '.env');
        if (fs.existsSync(envPath)) return envPath;
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
const supabaseKey = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function testPush() {
    console.log("--- TESTE MANUAL DE PUSH NOTIFICATION ---");
    
    // 1. Buscar o token mais recente no banco
    const tokenRes = await fetch(`${supabaseUrl}/rest/v1/push_tokens?select=*&limit=1&order=created_at.desc`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const tokens = await tokenRes.json();

    if (!tokens || tokens.length === 0) {
        console.error("❌ Erro: Nenhum token encontrado na tabela 'push_tokens'.");
        console.log("Certifique-se de que abriu o app no celular e fez login.");
        return;
    }

    const target = tokens[0];
    console.log(`✅ Token encontrado para o usuário: ${target.user_id}`);
    console.log(`📱 Plataforma: ${target.platform}`);

    // 2. Chamar a Edge Function simulando uma mensagem
    console.log("\n🚀 Disparando Edge Function 'send_push_notification'...");
    
    const functionUrl = `${supabaseUrl}/functions/v1/send_push_notification`;
    const payload = {
        type: 'chat_message',
        record: {
            receiver_id: target.user_id,
            sender_id: target.user_id, // Simulando auto-envio para teste
            content: "🚀 Teste de Notificação Feirão da Orca!",
            ad_id: "00000000-0000-0000-0000-000000000000" // ID fictício
        }
    };

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
        console.log("\n🎉 SUCESSO!");
        console.log("Resultado:", JSON.stringify(result, null, 2));
        console.log("\nVerifique seu celular agora!");
    } else {
        console.error("\n❌ ERRO ao chamar Edge Function:");
        console.log(JSON.stringify(result, null, 2));
    }
}

testPush();
