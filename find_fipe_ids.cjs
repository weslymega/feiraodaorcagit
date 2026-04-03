
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const PARALLELUM_BASE = 'https://parallelum.com.br/fipe/api/v1';

async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function getModels(brandId) {
    const res = await fetchWithTimeout(`${PARALLELUM_BASE}/carros/marcas/${brandId}/modelos`);
    if (res.ok) {
        const data = await res.json();
        return data.modelos;
    }
    return [];
}

async function getYears(brandId, modelId) {
    const res = await fetchWithTimeout(`${PARALLELUM_BASE}/carros/marcas/${brandId}/modelos/${modelId}/anos`);
    if (res.ok) {
        const data = await res.json();
        return data;
    }
    return [];
}

async function findIds() {
    const targets = [
        { brand: 'Fiat', brandId: '21', modelNames: ['Strada', 'Argo', 'Uno', 'Mobi'] },
        { brand: 'Ford', brandId: '22', modelNames: ['Ka', 'EcoSport'] },
        { brand: 'Renault', brandId: '55', modelNames: ['Kwid', 'Sandero', 'Logan'] },
        { brand: 'Jeep', brandId: '29', modelNames: ['Compass', 'Renegade'] },
        { brand: 'VW', brandId: '59', modelNames: ['Polo', 'Voyage', 'Fox', 'Saveiro'] }
    ];

    for (const target of targets) {
        console.log(`\n--- ${target.brand} (${target.brandId}) ---`);
        const models = await getModels(target.brandId);
        for (const name of target.modelNames) {
            const found = models.filter(m => m.nome.toLowerCase().includes(name.toLowerCase())).slice(0, 2);
            for (const f of found) {
                const years = await getYears(target.brandId, f.codigo);
                const year = years[0] || { codigo: '?', nome: '?' };
                console.log(`Model: ${f.nome} | ModelId: ${f.codigo} | YearId: ${year.codigo} | Year: ${year.nome}`);
            }
        }
    }
}

findIds();
