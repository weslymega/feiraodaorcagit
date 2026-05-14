const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf-8').split('\n');
const url = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const key = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

async function run() {
  try {
    const res = await fetch(`${url}/rest/v1/messages?select=*&limit=3&order=created_at.desc`, {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    const data = await res.json();
    console.log('Ultimas mensagens:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
  }
}

run();
