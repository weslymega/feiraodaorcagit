
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env'); // Path to root .env
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const targetToken = "ctBenZJZQ7aKwcMgWa37FP:APA91bFASa69sKfDrxQAqQZ1CWG76_ddH73Q9KV5YtocCBbzrUKYIkz6qZNbt9DU-NmFTI2BgrY2nD0j4zoJ6dz6EyqG9PU1pHsd-4zds8yvez2Ehz9kPY8";

async function testSpecific() {
    console.log("🎯 TESTE DE PUSH PARA TOKEN ESPECÍFICO...");
    
    const tokenRes = await fetch(`${supabaseUrl}/rest/v1/push_tokens?token=eq.${targetToken}&select=user_id`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const tokens = await tokenRes.json();
    
    if (!tokens || tokens.length === 0) {
        console.error("❌ Erro: Token não encontrado no banco de dados.");
        return;
    }
    
    const userId = tokens[0].user_id;
    console.log(`✅ Token vinculado ao usuário: ${userId}`);
    
    const functionUrl = `${supabaseUrl}/functions/v1/send_push_notification`;
    const payload = {
        type: 'INSERT',
        table: 'messages',
        record: {
            receiver_id: userId,
            sender_id: 'a6fd5065-2fe4-4fb3-adb5-36ad477dbd7b',
            content: "🎯 Teste Direcionado: " + new Date().toLocaleTimeString(),
            ad_id: "744f73d5-70ea-44aa-af75-9c939698d368"
        }
    };

    console.log("🚀 Enviando requisição para Edge Function...");
    const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log("📦 Resposta:", JSON.stringify(result, null, 2));
}

testSpecific();
