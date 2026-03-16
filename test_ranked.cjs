const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const supabaseKey = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

fetch(supabaseUrl + '/rest/v1/anuncios_ranked?limit=1', {
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey
  }
}).then(r => r.json()).then(data => {
  if (data.error || data.message) console.error(data);
  else {
    console.log(JSON.stringify(data[0], null, 2));
  }
}).catch(console.error);
