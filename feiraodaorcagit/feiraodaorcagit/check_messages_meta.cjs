const fs = require('fs');
const env = fs.readFileSync('C:/Users/machine3/feiraodaorcagit/.env', 'utf-8').split('\n');
const url = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function checkConstraints() {
    const query = `
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'messages';
    `;
    // Using a different approach to get column info since I can't use RPC easily
    // I'll just check if I can get the info via a dummy select
    const res = await fetch(url + '/rest/v1/messages?limit=0', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Prefer': 'count=exact' }
    });
    console.log("Headers:", JSON.stringify([...res.headers.entries()], null, 2));
}

checkConstraints();
