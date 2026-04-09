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

async function check() {
  const models = [
    { brand: 'Toyota', model: 'Corolla', brandId: '56', modelId: '900' },
    { brand: 'Honda', model: 'Civic', brandId: '25', modelId: '127' },
    { brand: 'VW', model: 'Gol', brandId: '59', modelId: '205' },
    { brand: 'GM', model: 'Onix', brandId: '23', modelId: '6175' },
    { brand: 'Hyundai', model: 'HB20', brandId: '26', modelId: '6013' }
  ];

  for (const m of models) {
    const res = await fetch(`/carros/marcas/${m.brandId}/modelos/${m.modelId}/anos`);
    if (res.ok) {
        const years = await res.json();
        console.log(`${m.brand} ${m.model}: ${years.map(y => y.codigo).join(', ')}`);
    } else {
        console.log(`Failed to fetch years for ${m.brand} ${m.model}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

check();
