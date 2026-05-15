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
    if (!envPath) {
        console.error("❌ Erro: Arquivo .env não encontrado.");
        return;
    }

    const env = fs.readFileSync(envPath, 'utf-8').split('\n');
    const urlLine = env.find(l => l.startsWith('VITE_SUPABASE_URL='));
    const keyLine = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='));

    if (!urlLine || !keyLine) {
        console.error("❌ Erro: Variáveis do Supabase não encontradas no .env");
        return;
    }

    const url = urlLine.split('=')[1].trim().replace(/['"]/g, '');
    const key = keyLine.split('=')[1].trim().replace(/['"]/g, '');

    const userId = 'e13e0888-3b87-46e0-b772-1be65409ab88';

    console.log(`🧹 Limpando tokens para o usuário ${userId}...`);
    
    const res = await fetch(`${url}/rest/v1/push_tokens?user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: { 
            'apikey': key, 
            'Authorization': 'Bearer ' + key 
        }
    });

    if (res.ok) {
        console.log('✅ SUCESSO: Todos os tokens antigos foram removidos do banco.');
        console.log('📱 Agora peça para o destinatário abrir o app para gerar um token novo e válido.');
    } else {
        const err = await res.text();
        console.error('❌ ERRO ao limpar tokens:', err);
    }
}

cleanup();
