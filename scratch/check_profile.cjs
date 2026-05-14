const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf-8').split('\n');
const url = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const key = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

const userId = '3e503cc0-d8bc-429e-9781-8c009da8ee97';

async function run() {
  try {
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    const data = await res.json();
    console.log('Perfil (profiles):', JSON.stringify(data, null, 2));

    const res2 = await fetch(`${url}/rest/v1/public_profiles?id=eq.${userId}&select=*`, {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    const data2 = await res2.json();
    console.log('Perfil (public_profiles):', JSON.stringify(data2, null, 2));
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
  }
}

run();
