const fs = require('fs');
const path = require('path');

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
const supabaseKey = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function dumpTokens() {
    console.log("--- DUMPING ALL PUSH TOKENS ---");
    const res = await fetch(`${supabaseUrl}/rest/v1/push_tokens?select=*&order=created_at.desc`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const tokens = await res.json();
    console.log(`Total tokens found: ${tokens.length}`);
    for (const t of tokens) {
        console.log(`\nUser ID: ${t.user_id}`);
        console.log(`Platform: ${t.platform}`);
        console.log(`Last Seen: ${t.last_seen_at}`);
        console.log(`Token Length: ${t.token ? t.token.length : 0}`);
        console.log(`Token: "${t.token}"`);
    }
}

dumpTokens();
