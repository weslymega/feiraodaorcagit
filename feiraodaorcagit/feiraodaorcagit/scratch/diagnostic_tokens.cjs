const fs = require('fs');
const path = require('path');
const { JWT } = require('google-auth-library');

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
const env = fs.readFileSync(envPath, 'utf-8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const supabaseKey = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');
const firebaseSecrets = JSON.parse(env.find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT=')).split('=')[1].trim().replace(/['"]/g, ''));

const TARGET_USER_ID = 'e13e0888-3b87-46e0-b772-1be65409ab88';

async function getAccessToken(serviceAccount) {
    const jwtClient = new JWT(
        serviceAccount.client_email,
        null,
        serviceAccount.private_key,
        ['https://www.googleapis.com/auth/cloud-platform']
    );
    const tokens = await jwtClient.authorize();
    return tokens.access_token;
}

async function testAllTokens() {
    console.log(`--- TESTE DETALHADO DE TOKENS PARA: ${TARGET_USER_ID} ---`);
    
    const res = await fetch(`${supabaseUrl}/rest/v1/push_tokens?select=*&user_id=eq.${TARGET_USER_ID}`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const tokens = await res.json();
    console.log(`Encontrados ${tokens.length} tokens.\n`);

    const accessToken = await getAccessToken(firebaseSecrets);
    const projectId = firebaseSecrets.project_id;

    for (const t of tokens) {
        console.log(`Verificando Token ID: ${t.id} (Criado em: ${t.created_at})`);
        console.log(`Token: ${t.token.substring(0, 20)}...`);
        
        const fcmPayload = {
            message: {
                token: t.token,
                notification: {
                    title: "Teste de Diagnóstico",
                    body: "Se você recebeu isso, este token é o válido!"
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channel_id: 'default_v2'
                    }
                }
            }
        };

        const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fcmPayload)
        });

        const result = await fcmRes.json();
        if (fcmRes.ok) {
            console.log("✅ FCM SUCESSO:", result.name);
        } else {
            console.log("❌ FCM ERRO:", result.error.status, "-", result.error.message);
        }
        console.log("---------------------------------------------------\n");
    }
}

testAllTokens();
