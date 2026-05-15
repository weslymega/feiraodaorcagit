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

async function checkTriggers() {
    console.log("--- CHECKING TRIGGERS ON 'messages' TABLE ---");
    
    const query = `
        SELECT trigger_name, action_statement, action_timing, event_manipulation
        FROM information_schema.triggers
        WHERE event_object_table = 'messages';
    `;

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: query })
    });

    if (res.ok) {
        const triggers = await res.json();
        console.log(JSON.stringify(triggers, null, 2));
    } else {
        const error = await res.text();
        console.error("Error fetching triggers:", error);
        
        console.log("Trying via direct query if possible...");
        const res2 = await fetch(`${supabaseUrl}/rest/v1/?select=1`, {
             headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        console.log("Supabase is reachable.");
    }
}

checkTriggers();
