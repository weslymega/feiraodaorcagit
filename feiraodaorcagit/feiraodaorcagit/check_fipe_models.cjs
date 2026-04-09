const https = require('https');

const POPULAR_MODELS = [
  { brand: 'Toyota', model: 'Corolla', brandId: '56', modelId: '900', yearId: '2020-1', year: '2020' },
  { brand: 'Honda', model: 'Civic', brandId: '25', modelId: '127', yearId: '2016-1', year: '2016' },
  { brand: 'VW', model: 'Gol', brandId: '59', modelId: '205', yearId: '2018-1', year: '2018' },
  { brand: 'GM', model: 'Onix', brandId: '23', modelId: '6175', yearId: '2019-1', year: '2019' },
  { brand: 'Hyundai', model: 'HB20', brandId: '26', modelId: '6013', yearId: '2017-1', year: '2017' },
  { brand: 'Fiat', model: 'Strada', brandId: '21', modelId: '9112', yearId: '2024-5', year: '2024' },
  { brand: 'Fiat', model: 'Argo', brandId: '21', modelId: '7965', yearId: '2024-5', year: '2024' },
  { brand: 'VW', model: 'Polo', brandId: '59', modelId: '10176', yearId: '2024-5', year: '2024' },
  { brand: 'Ford', model: 'Ka', brandId: '22', modelId: '6915', yearId: '2020-5', year: '2020' },
  { brand: 'Renault', model: 'Kwid', brandId: '48', modelId: '8023', yearId: '2024-5', year: '2024' }
];

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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve({ ok: true, status: res.statusCode, json: () => Promise.resolve(JSON.parse(data)) }); }
          catch (e) { resolve({ ok: false, status: res.statusCode }); }
        } else {
          resolve({ ok: false, status: res.statusCode, json: () => Promise.resolve(JSON.parse(data || '{}')) });
        }
      });
    }).on('error', reject);
  });
}

async function checkModels() {
  for (const item of POPULAR_MODELS) {
    const path = `/carros/marcas/${item.brandId}/modelos/${item.modelId}/anos/${item.yearId}`;
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ ${item.brand} ${item.model} (${item.yearId}): ${data.Valor}`);
      } else {
        console.log(`❌ ${item.brand} ${item.model} (${item.yearId}): Status ${res.status}`);
        const yearsPath = `/carros/marcas/${item.brandId}/modelos/${item.modelId}/anos`;
        const yearsRes = await fetch(yearsPath);
        if (yearsRes.ok) {
          const yearsData = await yearsRes.json();
          console.log(`   Available years for ${item.brand} ${item.model}: ${yearsData.map(y => y.codigo).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`💥 ${item.brand} ${item.model} (${item.yearId}): Error ${e.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

checkModels();
