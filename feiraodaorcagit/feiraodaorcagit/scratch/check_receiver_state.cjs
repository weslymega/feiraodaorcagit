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

const RECEIVER_ID = 'e13e0888-3b87-46e0-b772-1be65409ab88';

async function checkState() {
    console.log(`--- CHECKING STATE FOR RECEIVER: ${RECEIVER_ID} ---`);
    
    // 1. Check Profile
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=push_notifications_enabled,push_chat_enabled&id=eq.${RECEIVER_ID}`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const profile = await profileRes.json();
    console.log("Profile:", JSON.stringify(profile, null, 2));

    // 2. Check Tokens
    const tokensRes = await fetch(`${supabaseUrl}/rest/v1/push_tokens?select=*&user_id=eq.${RECEIVER_ID}`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const tokens = await tokensRes.json();
    console.log("Tokens:", JSON.stringify(tokens, null, 2));
    
    // 3. Check if there are any recent messages to this receiver
    const msgRes = await fetch(`${supabaseUrl}/rest/v1/messages?select=id,created_at&receiver_id=eq.${RECEIVER_ID}&order=created_at.desc&limit=5`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    // Try 'mensagens' if 'messages' fails
    let messages = await msgRes.json();
    if (messages.error) {
        const msgRes2 = await fetch(`${supabaseUrl}/rest/v1/mensagens?select=id,created_at&receiver_id=eq.${RECEIVER_ID}&order=created_at.desc&limit=5`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        messages = await msgRes2.json();
    }
    console.log("Recent Messages:", JSON.stringify(messages, null, 2));
}

checkState();
