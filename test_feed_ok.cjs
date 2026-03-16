const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const supabaseKey = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

fetch(supabaseUrl + '/rest/v1/rpc/get_feed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey
  },
  body: JSON.stringify({ limit_count: 5 })
}).then(r => r.json()).then(data => {
  if (data.error || data.message) console.error(data);
  else {
    console.log("SUCCESS. Ads returned: " + data.length);
    data.forEach(ad => {
      console.log(`Ad: ${ad.titulo}`);
      console.log(`Profiles:`, ad.profiles);
      console.log('---');
    });
  }
}).catch(console.error);
