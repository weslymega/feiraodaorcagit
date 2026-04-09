const https = require('https');
const PARALLELUM_BASE = 'parallelum.com.br';

function fetch(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: PARALLELUM_BASE,
      path: '/fipe/api/v1' + path,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode < 300, json: () => Promise.resolve(JSON.parse(data)) }); }
        catch (e) { resolve({ ok: false }); }
      });
    }).on('error', reject);
  });
}

async function checkModels() {
  const res = await fetch('/carros/marcas/56/modelos');
  if (res.ok) {
      const data = await res.json();
      const models = data.modelos || data;
      const corolla = models.filter(m => m.nome.includes('Corolla'));
      console.log('Toyota Corolla Models:');
      corolla.forEach(m => console.log(`${m.nome}: ${m.codigo}`));
  }
}

checkModels();
