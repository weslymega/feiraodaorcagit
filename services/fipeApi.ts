
// Interface para os itens básicos (Marca, Modelo, Ano)
export interface FipeItem {
  codigo: string;
  nome: string;
}

// Interface para o detalhe completo do veículo
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

// Tipos de veículos suportados pela API Parallelum
export type FipeVehicleType = 'carros' | 'motos' | 'caminhoes';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

// Estrutura para o cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Helper para gerenciar cache no localStorage
const cacheManager = {
  get: <T>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);
      const isExpired = Date.now() - item.timestamp > CACHE_EXPIRATION;

      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error(`Erro ao ler cache FIPE (${key}):`, error);
      return null;
    }
  },

  set: <T>(key: string, data: T): void => {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`Erro ao salvar cache FIPE (${key}):`, error);
    }
  }
};

export const fipeApi = {
  // Buscar Marcas
  getBrands: async (type: FipeVehicleType = 'carros'): Promise<FipeItem[]> => {
    const cacheKey = `fipe_brands_${type}`;
    const cachedData = cacheManager.get<FipeItem[]>(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await fetch(`${BASE_URL}/${type}/marcas`);
      if (!response.ok) throw new Error('Falha ao buscar marcas');
      const data = await response.json();
      cacheManager.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Buscar Modelos pela Marca
  getModels: async (type: FipeVehicleType, brandId: string): Promise<FipeItem[]> => {
    const cacheKey = `fipe_models_${type}_${brandId}`;
    const cachedData = cacheManager.get<FipeItem[]>(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await fetch(`${BASE_URL}/${type}/marcas/${brandId}/modelos`);
      if (!response.ok) throw new Error('Falha ao buscar modelos');
      const data = await response.json();
      const models = data.modelos || [];
      cacheManager.set(cacheKey, models);
      return models;
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Buscar Anos pelo Modelo
  getYears: async (type: FipeVehicleType, brandId: string, modelId: string): Promise<FipeItem[]> => {
    const cacheKey = `fipe_years_${type}_${brandId}_${modelId}`;
    const cachedData = cacheManager.get<FipeItem[]>(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await fetch(`${BASE_URL}/${type}/marcas/${brandId}/modelos/${modelId}/anos`);
      if (!response.ok) throw new Error('Falha ao buscar anos');
      const data = await response.json();
      cacheManager.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Buscar Detalhes (Preço) pelo Ano - SEM CACHE PARA PREÇO REAL-TIME
  getDetail: async (type: FipeVehicleType, brandId: string, modelId: string, yearId: string): Promise<FipeDetail | null> => {
    try {
      const response = await fetch(`${BASE_URL}/${type}/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`);
      if (!response.ok) throw new Error('Falha ao buscar detalhes');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  }
};
