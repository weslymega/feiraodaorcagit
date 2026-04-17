import { supabase } from './api';
import { fipeNormalizer } from '../utils/fipeNormalizer';

export interface Brand {
  codigo: string;
  nome: string;
}

export interface Model {
  codigo: string;
  nome: string;
}

export interface Year {
  codigo: string;
  nome: string;
}

export interface FipeItem {
  codigo: string;
  nome: string;
}

export interface FipeDetail {
  TipoVeiculo: number;
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  SiglaCombustivel: string;
}

export type FipeVehicleType = 'carros' | 'motos' | 'caminhoes';

// Base URLs
const BRASIL_API_BASE = 'https://brasilapi.com.br/api/fipe';
const PARALLELUM_BASE = 'https://parallelum.com.br/fipe/api/v1';

// Cache Controls
const FETCH_TIMEOUT_MS = 5000;
const DB_CACHE_DAYS = 7;

// Memory Cache for Lists
const listMemoryCache = new Map<string, { data: any, timestamp: number }>();

// Concurrency Control: prevents duplicate simultaneous requests for the same key
const pendingRequests = new Map<string, Promise<any>>();

const isDev = process.env.NODE_ENV === 'development';
const loggedErrors = new Set<string>();

const logCriticalOnce = (msg: string) => {
  if (!loggedErrors.has(msg)) {
    console.error(msg);
    loggedErrors.add(msg);
  }
};

// Helper: Validation for code-side expiration
const isCodeExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

// Helper: Timeout Fetch
const fetchWithTimeout = async (url: string, timeout = FETCH_TIMEOUT_MS) => {
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
};

/**
 * Core cache-first & resilient fetcher for FIPE lists
 */
const fetchListWithCache = async (
  key: string,
  type: 'brands' | 'models' | 'years',
  brasilApiUrl: string | null,
  parallelumUrl: string,
  formatter: (data: any, source: 'brasil' | 'parallelum') => any
): Promise<any[]> => {
  // 1. Memory Cache Check
  const memoryEntry = listMemoryCache.get(key);
  if (memoryEntry && (Date.now() - memoryEntry.timestamp < 1000 * 60 * 60)) { // 1h memory TTL
    return memoryEntry.data;
  }

  // 2. Concurrency Control: If a request for this key is already in flight, wait for it
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const fetchPromise = (async () => {
    let expiredFallback = null;

    // 3. Supabase Cache Check
    try {
      const { data: dbEntry } = await supabase
        .from('fipe_lists_cache')
        .select('data, expires_at')
        .eq('key', key)
        .maybeSingle();

      if (dbEntry) {
        if (!isCodeExpired(dbEntry.expires_at)) {
          listMemoryCache.set(key, { data: dbEntry.data, timestamp: Date.now() });
          return dbEntry.data;
        } else {
          expiredFallback = dbEntry.data; // Store to use if APIs fail
        }
      }
    } catch (e) {
      if (isDev) console.warn(`[FIPE] DB Cache read error for ${key}`);
    }

    // 4. API Calls with Fallback
    let freshData = null;

    // Try BrasilAPI first (if available for this type)
    if (brasilApiUrl) {
      try {
        const res = await fetchWithTimeout(brasilApiUrl);
        if (res.ok) {
          const raw = await res.json();
          freshData = formatter(raw, 'brasil');
        }
      } catch (err) {
        if (isDev) console.warn(`[FIPE] BrasilAPI failed for ${key}, trying Parallelum...`);
      }
    }

    // Try Parallelum if BrasilAPI failed or was not provided
    if (!freshData && parallelumUrl) {
      try {
        const res = await fetchWithTimeout(parallelumUrl);
        if (res.ok) {
          const raw = await res.json();
          freshData = formatter(raw, 'parallelum');
        }
      } catch (err) {
        if (isDev) console.warn(`[FIPE] Parallelum failed for ${key}`);
      }
    }

    // 5. Final fallback to expired cache if all APIs fail
    if (!freshData && expiredFallback) {
      if (isDev) console.info(`[FIPE] Serving expired cache for ${key} due to API failure.`);
      return expiredFallback;
    }

    const finalResult = freshData || [];

    // 6. Save results to cache (Fire and forget, don't block return)
    if (freshData) {
      listMemoryCache.set(key, { data: freshData, timestamp: Date.now() });
      
      const saveData = async () => {
        try {
          const { error } = await supabase.from('fipe_lists_cache').upsert({
            key,
            type,
            data: freshData,
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + DB_CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()
          }, { onConflict: 'key' });
          
          if (error) {
             console.error(`[FIPE] Cache Save Error for ${key}:`, error.message);
          }
        } catch (e) {
          console.error(`[FIPE] Critical Cache Save Error for ${key}`, e);
        }
      };
      
      saveData();
    }

    return finalResult;
  })();

  pendingRequests.set(key, fetchPromise);
  
  try {
    const result = await fetchPromise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
};

export const fipeApi = {
  getBrands: async (type: FipeVehicleType = 'carros', prefix?: string): Promise<Brand[]> => {
    const key = prefix ? `${prefix}_${type}_brands` : `${type}_brands`;
    return fetchListWithCache(
      key,
      'brands',
      `${BRASIL_API_BASE}/marcas/v1/${type}`,
      `${PARALLELUM_BASE}/${type}/marcas`,
      (data, source) => {
        if (!Array.isArray(data)) return [];
        if (source === 'brasil') {
          return data.map((item: any) => ({ codigo: String(item.valor), nome: item.nome }));
        }
        return data.map((item: any) => ({ codigo: String(item.codigo), nome: item.nome }));
      }
    );
  },

  getModels: async (type: FipeVehicleType, brandId: string, prefix?: string): Promise<Model[]> => {
    const key = prefix ? `${prefix}_${type}_models_${brandId}` : `${type}_models_${brandId}`;
    return fetchListWithCache(
      key,
      'models',
      null, // BrasilAPI doesn't expose easy tree models
      `${PARALLELUM_BASE}/${type}/marcas/${brandId}/modelos`,
      (data) => {
        const models = data.modelos || data || [];
        if (!Array.isArray(models)) return [];
        return models.map((item: any) => ({ codigo: String(item.codigo), nome: item.nome }));
      }
    );
  },

  getYears: async (type: FipeVehicleType, brandId: string, modelId: string, prefix?: string): Promise<Year[]> => {
    const key = prefix ? `${prefix}_${type}_years_${brandId}_${modelId}` : `${type}_years_${brandId}_${modelId}`;
    return fetchListWithCache(
      key,
      'years',
      null,
      `${PARALLELUM_BASE}/${type}/marcas/${brandId}/modelos/${modelId}/anos`,
      (data) => {
        const anos = data.anos || data || [];
        if (!Array.isArray(anos)) return [];
        return anos.map((item: any) => ({ codigo: String(item.codigo), nome: item.nome }));
      }
    );
  },

  getDetail: async (type: FipeVehicleType, brandId: string, modelId: string, yearId: string, prefix?: string): Promise<FipeDetail | null> => {
    const key = prefix ? `${prefix}_fipe_detail_${type}_${brandId}_${modelId}_${yearId}` : `fipe_detail_${type}_${brandId}_${modelId}_${yearId}`;
    
    // Check traditional fipe_cache for details
    try {
      const { data } = await supabase.from('fipe_cache').select('data').eq('key', key).maybeSingle();
      if (data) return data.data;
    } catch (e) {}

    try {
      const res = await fetchWithTimeout(`${PARALLELUM_BASE}/${type}/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`);
      if (res.ok) {
        const detail = await res.json();
        if (detail && detail.Valor) {
          // Save to detail cache (Fire and forget)
          supabase.from('fipe_cache').upsert({
            key,
            marca: brandId,
            modelo: modelId,
            ano: yearId,
            data: detail
          }, { onConflict: 'key' }).then();
          
          return detail as FipeDetail;
        }
      }
    } catch (err) {
      if (isDev) console.warn(`[FIPE] Detail fetch failed for ${key}`);
    }

    return null;
  },

  // --- DYNAMIC LOOKUP FUNCTIONS ---

  findBrandIdByName: async (type: FipeVehicleType, brandName: string): Promise<string | null> => {
    const brands = await fipeApi.getBrands(type);
    const target = fipeNormalizer.normalizeBrandName(brandName);
    
    // Exact or contains match for brands (brands are simpler)
    const match = brands.find(b => {
      const name = fipeNormalizer.normalizeBrandName(b.nome);
      return name === target || name.includes(target) || target.includes(name);
    });
    
    return match ? match.codigo : null;
  },

  findBestModelAndYearId: async (type: FipeVehicleType, brandId: string, modelName: string, targetYearStr: string): Promise<{ modelId: string, yearId: string } | null> => {
    const models = await fipeApi.getModels(type, brandId);
    if (!models.length) return null;

    const targetNorm = fipeNormalizer.normalizeModelName(modelName);
    const candidates: { item: Model, score: number }[] = [];

    // Gather all matching candidates
    for (const item of models) {
        const itemNorm = fipeNormalizer.normalizeModelName(item.nome);
        const isSubstring = itemNorm.includes(targetNorm) || targetNorm.includes(itemNorm);
        const distance = fipeNormalizer.getLevenshteinDistance(targetNorm, itemNorm);
        const finalScore = isSubstring ? distance * 0.3 : distance;
        
        if (finalScore <= 0.5) {
            candidates.push({ item, score: finalScore });
        }
    }

    // Sort candidates: best match first
    candidates.sort((a, b) => a.score - b.score);
    
    let targetYearNumeric = parseInt(targetYearStr.replace(/\D/g, ''));
    if (isNaN(targetYearNumeric)) return null;

    // Search for the first candidate that ACTUALLY has the requested year (or fallback year)
    for (const candidate of candidates) {
        try {
            const years = await fipeApi.getYears(type, brandId, candidate.item.codigo);
            if (!years || !years.length) continue;

            let foundYearId: string | null = null;
            // Try exact year, then -1, then -2
            for (let attempt = 0; attempt <= 2; attempt++) {
                const currentStr = (targetYearNumeric - attempt).toString();
                const matches = years.filter(y => y.nome.includes(currentStr));
                
                if (matches.length > 0) {
                    const pref = matches.find(y => y.codigo.endsWith('-1') || y.codigo.endsWith('-5'));
                    foundYearId = pref ? pref.codigo : matches[0].codigo;
                    break;
                }
            }

            if (foundYearId) {
                return { modelId: candidate.item.codigo, yearId: foundYearId };
            }
        } catch (e) {
            // Ignore API failures for single models and test the next candidate
        }
    }

    return null;
  },

  // Backwards compatibility if needed elsewhere
  findYearIdByYear: async (type: FipeVehicleType, brandId: string, modelId: string, year: string): Promise<string | null> => {
    const years = await fipeApi.getYears(type, brandId, modelId);
    if (!years.length) return null;

    const targetNumeric = year.replace(/\D/g, ''); 
    if (!targetNumeric) return null;

    const numericMatches = years.filter(y => y.nome.includes(targetNumeric));

    if (numericMatches.length > 0) {
      if (numericMatches.length === 1) return numericMatches[0].codigo;
      const flexOrGasolina = numericMatches.find(y => y.codigo.endsWith('-1') || y.codigo.endsWith('-5'));
      return flexOrGasolina ? flexOrGasolina.codigo : numericMatches[0].codigo;
    }

    return null;
  }
};
