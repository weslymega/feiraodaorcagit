const fs = require('fs');
const env = fs.readFileSync('C:/Users/machine3/feiraodaorcagit/.env', 'utf-8').split('\n');
const url = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function checkPublicProfiles() {
    const ids = ['3e503cc0-d8bc-429e-9781-8c009da8ee97', 'a6fd5065-2fe4-4fb3-adb5-36ad477dbd7b'];
    const res = await fetch(url + '/rest/v1/public_profiles?select=id,name&id=in.(' + ids.join(',') + ')', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

checkPublicProfiles();
