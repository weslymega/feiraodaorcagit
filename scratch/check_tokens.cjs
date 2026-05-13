const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf-8').split('\n');
const url = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const key = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function run() {
  try {
    const res = await fetch(url + '/rest/v1/push_tokens?select=*&limit=5', {
      headers: { 
        apikey: key, 
        Authorization: 'Bearer ' + key 
      }
    });
    const data = await res.json();
    console.log('Tokens encontrados:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Erro ao buscar tokens:', err);
  }
}

run();
