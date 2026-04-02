import { supabase } from './api';

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
      supabase.from('fipe_lists_cache').upsert({
        key,
        type,
        data: freshData,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + DB_CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'key' }).then(({ error }) => {
        if (error && isDev) console.warn(`[FIPE] Failed to save DB cache for ${key}`, error);
      });
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
  getBrands: async (type: FipeVehicleType = 'carros'): Promise<Brand[]> => {
    const key = `${type}_brands`;
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

  getModels: async (type: FipeVehicleType, brandId: string): Promise<Model[]> => {
    const key = `${type}_models_${brandId}`;
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

  getYears: async (type: FipeVehicleType, brandId: string, modelId: string): Promise<Year[]> => {
    const key = `${type}_years_${brandId}_${modelId}`;
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

  getDetail: async (type: FipeVehicleType, brandId: string, modelId: string, yearId: string): Promise<FipeDetail | null> => {
    const key = `fipe_detail_${type}_${brandId}_${modelId}_${yearId}`;
    
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
  }
};
