const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const supabaseKey = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

const sql = `
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'anuncios_ranked';
`;

fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, { // we probably cant do this directly if not exposed, let's try querying the view and inspecting keys
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey
  }
}).catch(console.error);

// Alternatively, just query one row and infer types:
fetch(`${supabaseUrl}/rest/v1/anuncios_ranked?limit=1`, {
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey
  }
}).then(r => r.json()).then(data => {
  if(data && data.length > 0) {
     const row = data[0];
     for (const key in row) {
         console.log(`Column: ${key}, Type: ${typeof row[key]}, Value: ${row[key]}`);
     }
  } else {
     console.log(data);
  }
}).catch(console.error);
