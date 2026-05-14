const fs = require('fs');
const env = fs.readFileSync('C:/Users/machine3/feiraodaorcagit/.env', 'utf-8').split('\n');
const url = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function checkTokens() {
    const res = await fetch(url + '/rest/v1/push_tokens?select=user_id,platform,last_seen_at', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const data = await res.json();
    console.log("Count of tokens:", data.length);
    console.log(JSON.stringify(data, null, 2));
}

checkTokens();
