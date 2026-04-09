const https = require('https');

const STOP_WORDS = [
  'xei', 'xli', 'gli', 'altis', 'gr-s', 'xre', 'xrv', 'xrx', 'se-g', 's', 'le', 'dx',
  'lt', 'ltz', 'ls', 'premier', 'rs', 'activ', 'joy',
  'trend', 'trendline', 'comfortline', 'highline', 'gti', 'gts', 'msi', 'tsi',
  'attractive', 'essence', 'sporting', 'way', 'trekking', 'volcano', 'ranch', 'ultra',
  'titanium', 'se', 'sel', 'freestyle', 'plus',
  'ex', 'exl', 'lx', 'touring', 'si',
  'vision', 'evolution', 'platinum', 'sport', 'diamond',
  '1.0', '1.3', '1.4', '1.5', '1.6', '1.8', '2.0', '2.2', '2.4', '2.5', '2.8', '3.0',
  '8v', '16v', '24v',
  'flex', 'gasolina', 'alcool', 'diesel', 'hibrido', 'híbrido', 'turbo',
  'aut', 'aut.', 'mec', 'mec.', 'cvt', 'manual', 'automatico', 'automático',
  '4x4', '4x2', 'awd', '4wd'
];

function normalizeModelName(name) {
    if (!name) return '';
    let normalized = name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    STOP_WORDS.forEach(word => {
        let w = word.replace(/\./g, '\\.');
        normalized = normalized.replace(new RegExp(`\\b${w}\\b`, 'gi'), ' ');
    });

    normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
    let tokens = normalized.split(/\s+/).filter(Boolean);
    
    if (tokens.length === 0) {
       return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)[0] || '';
    }
    return tokens.join(' ');
}

function normalizeBrandName(name) {
    if (!name) return '';
    let normalized = name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes('vw') || normalized.includes('volkswagen')) return 'vw - volkswagen';
    if (normalized.includes('gm') || normalized.includes('chevrolet')) return 'gm - chevrolet';
    return normalized;
}

function getLevenshteinDistance(a, b) {
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 0 : distance / maxLength;
}

function fetch(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'parallelum.com.br',
      path: '/fipe/api/v1' + path,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode < 300, status: res.statusCode, json: () => Promise.resolve(JSON.parse(data)) }); }
        catch (e) { resolve({ ok: false }); }
      });
    }).on('error', reject);
  });
}

async function testDiscovery() {
    const cars = [
        { brand: 'Toyota', model: 'Corolla', year: '2020' },
        { brand: 'Honda', model: 'Civic', year: '2016' },
        { brand: 'VW', model: 'Gol', year: '2018' },
        { brand: 'Fiat', model: 'Strada', year: '2024' },
        { brand: 'Renault', model: 'Kwid', year: '2024' }
    ];

    console.log("--- STARTING DYNAMIC FIPE TEST ---");

    for (const car of cars) {
        console.log(`\n🔍 Tracing: ${car.brand} ${car.model} ${car.year}`);
        try {
            // 1. BRAND
            const brandRes = await fetch('/carros/marcas');
            const brands = await brandRes.json();
            const targetBrand = normalizeBrandName(car.brand);
            const brandMatch = brands.find(b => {
                const name = normalizeBrandName(b.nome);
                return name === targetBrand || name.includes(targetBrand) || targetBrand.includes(name);
            });

            if (!brandMatch) {
                console.log(`❌ Brand FAIL: Could not find ${car.brand}`);
                continue;
            }

            // 2. MODEL
            const modelRes = await fetch(`/carros/marcas/${brandMatch.codigo}/modelos`);
            const modelData = await modelRes.json();
            const models = modelData.modelos || modelData;
            
            const targetNorm = normalizeModelName(car.model);
            
            // Gather all candidates instead of picking just one
            const candidates = [];
            for (const item of models) {
                const itemNorm = normalizeModelName(item.nome);
                const isSubstring = itemNorm.includes(targetNorm) || targetNorm.includes(itemNorm);
                const distance = getLevenshteinDistance(targetNorm, itemNorm);
                const finalScore = isSubstring ? distance * 0.3 : distance;
                
                if (finalScore <= 0.5) {
                    candidates.push({ item, score: finalScore });
                }
            }

            // Sort candidates: closest match first
            candidates.sort((a, b) => a.score - b.score);
            
            if (candidates.length === 0) {
                console.log(`❌ Model FAIL: Could not find candidates for ${car.model}`);
                continue;
            }

            console.log(`👀 Encontrados ${candidates.length} candidatos de modelo. Tentando validar ano...`);
            
            let finalModel = null;
            let finalYearId = null;

            // Try each candidate until we find one that possesses the requested year
            for (const candidate of candidates) {
                const yearRes = await fetch(`/carros/marcas/${brandMatch.codigo}/modelos/${candidate.item.codigo}/anos`);
                if (!yearRes.ok) continue;
                const years = await yearRes.json();
                
                let targetYear = parseInt(car.year);
                let foundYearId = null;
                for (let attempt = 0; attempt <= 2; attempt++) {
                    const currentStr = (targetYear - attempt).toString();
                    const matches = years.filter(y => y.nome.includes(currentStr));
                    if (matches.length > 0) {
                        const pref = matches.find(y => y.codigo.endsWith('-1') || y.codigo.endsWith('-5'));
                        foundYearId = pref ? pref.codigo : matches[0].codigo;
                        break;
                    }
                }

                if (foundYearId) {
                    finalModel = candidate.item;
                    finalYearId = foundYearId;
                    console.log(`✅ Candidate Selected: ${finalModel.nome} (Score: ${candidate.score.toFixed(2)})`);
                    break;
                }
            }

            if (!finalModel || !finalYearId) {
                console.log(`❌ FALLBACK FAIL: Não encontramos nenhuma variação do modelo com o ano ${car.year}`);
                continue;
            }


            // 4. PRICE
            const priceRes = await fetch(`/carros/marcas/${brandMatch.codigo}/modelos/${finalModel.codigo}/anos/${finalYearId}`);
            if (priceRes.ok) {
                const detail = await priceRes.json();
                console.log(`💵 PRICE FOUND: ${detail.Valor}`);
            } else {
                console.log(`❌ API Error on Final Request: ${priceRes.status}`);
            }

        } catch (err) {
            console.log('💥 ERROR:', err.message);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

testDiscovery();
