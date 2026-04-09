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

async function checkBrands() {
  const res = await fetch('/carros/marcas');
  if (res.ok) {
      const brands = await res.json();
      const targets = ['Toyota', 'Honda', 'VW', 'Fiat', 'GM', 'Hyundai', 'Ford', 'Renault'];
      const found = brands.filter(b => targets.some(t => b.nome.includes(t)));
      console.log('Brands found:');
      found.forEach(b => console.log(`${b.nome}: ${b.codigo}`));
  }
}

checkBrands();
