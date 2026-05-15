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
const env = fs.readFileSync(envPath, 'utf-8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const supabaseKey = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function findToken() {
    const res = await fetch(`${supabaseUrl}/rest/v1/push_tokens?token=ilike.egXsaiHDQu%`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const data = await res.json();
    console.log("Ghost Token Search Result:", JSON.stringify(data, null, 2));
}

findToken();
