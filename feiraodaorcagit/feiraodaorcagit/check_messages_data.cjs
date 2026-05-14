const fs = require('fs');
const env = fs.readFileSync('C:/Users/machine3/feiraodaorcagit/.env', 'utf-8').split('\n');
const url = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function checkMessages() {
    const res = await fetch(url + '/rest/v1/messages?select=id,sender_id,receiver_id,content,ad_id&limit=5&order=created_at.desc', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

checkMessages();
