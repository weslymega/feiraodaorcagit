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

async function cleanup() {
    const envPath = findEnv();
    const env = fs.readFileSync(envPath, 'utf-8').split('\n');
    const url = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
    const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

    const userId = '3e503cc0-d8bc-429e-9781-8c009da8ee97'; // ID do Usuário A (NiNa.com)

    console.log(`🧹 Limpando tokens para o Usuário A (${userId})...`);
    
    const res = await fetch(`${url}/rest/v1/push_tokens?user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: { 
            'apikey': key, 
            'Authorization': 'Bearer ' + key 
        }
    });

    if (res.ok) {
        console.log('✅ SUCESSO: Tokens do Usuário A limpos.');
    } else {
        console.error('❌ ERRO:', await res.text());
    }
}

cleanup();
