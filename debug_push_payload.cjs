
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { JWT } = require('google-auth-library');

// 1. Configuração do Ambiente
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

// 2. Argumentos
const deviceToken = process.argv[2];
const testType = process.argv[3] || 'mixed'; // 'notification', 'data', 'mixed'

if (!deviceToken) {
    console.error("❌ Erro: Informe o token do dispositivo como argumento.");
    console.log("Uso: node debug_push_payload.cjs <TOKEN> [notification|data|mixed]");
    process.exit(1);
}

// 3. Obter Service Account do Supabase (para simular a Edge Function)
async function getFirebaseSecrets() {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    // Em produção, isso está nos secrets da function. 
    // Aqui vamos ler do .env se existir ou tentar simular.
    const secretsJson = getEnvVar('FIREBASE_SERVICE_ACCOUNT');
    if (!secretsJson) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT não encontrado no .env");
    }
    return JSON.parse(secretsJson);
}

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

async function sendPush() {
    console.log(`🚀 Iniciando teste de push do tipo: ${testType}`);
    const secrets = await getFirebaseSecrets();
    const accessToken = await getAccessToken(secrets);
    const projectId = secrets.project_id;

    let messageBody = {
        message: {
            token: deviceToken,
        }
    };

    const commonData = {
        debug: "true",
        test_id: Date.now().toString(),
        title: "Teste de Debug",
        body: `Este é um teste do tipo ${testType}`
    };

    if (testType === 'notification' || testType === 'mixed') {
        messageBody.message.notification = {
            title: "🔔 Notificação OS",
            body: `Teste via campo notification (${testType})`
        };
    }

    if (testType === 'data' || testType === 'mixed') {
        messageBody.message.data = commonData;
    }

    // Configuração Android
    messageBody.message.android = {
        priority: "high",
        notification: {
            channel_id: "default",
            sound: "default",
            icon: "ic_launcher"
        }
    };

    console.log("📦 Payload enviado:", JSON.stringify(messageBody, null, 2));

    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageBody)
    });

    const result = await res.json();
    if (res.ok) {
        console.log("✅ SUCESSO FCM:", JSON.stringify(result, null, 2));
    } else {
        console.error("❌ ERRO FCM:", JSON.stringify(result, null, 2));
    }
}

sendPush().catch(console.error);
