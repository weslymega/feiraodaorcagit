import { fipeApi, Brand, Model, Year, FipeDetail, FipeVehicleType } from './fipeApi';

const CACHE_PREFIX = 'fipe_explorer';
const REQUEST_DELAY_MS = 200;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const FipeExplorerService = {
  /**
   * Obtém todas as marcas para um tipo de veículo
   */
  getBrands: async (type: FipeVehicleType = 'carros'): Promise<Brand[]> => {
    console.log(`[FIPE_EXPLORER] Loading brands for ${type}...`);
    const brands = await fipeApi.getBrands(type, CACHE_PREFIX);
    console.log(`[FIPE_EXPLORER] Brands loaded: ${brands.length}`);
    return brands;
  },

  /**
   * Obtém modelos baseados no ID da marca
   */
  getModelsByBrand: async (type: FipeVehicleType, brandId: string): Promise<Model[]> => {
    await delay(REQUEST_DELAY_MS);
    console.log(`[FIPE_EXPLORER] Loading models for brand ${brandId}...`);
    const models = await fipeApi.getModels(type, brandId, CACHE_PREFIX);
    console.log(`[FIPE_EXPLORER] Models loaded: ${models.length}`);
    return models;
  },

  /**
   * Obtém anos/versões baseados no ID do modelo
   */
  getYearsByModel: async (type: FipeVehicleType, brandId: string, modelId: string): Promise<Year[]> => {
    await delay(REQUEST_DELAY_MS);
    console.log(`[FIPE_EXPLORER] Loading years for model ${modelId}...`);
    const years = await fipeApi.getYears(type, brandId, modelId, CACHE_PREFIX);
    console.log(`[FIPE_EXPLORER] Years loaded: ${years.length}`);
    return years;
  },

  /**
   * Obtém o detalhe final do preço
   */
  getPrice: async (type: FipeVehicleType, brandId: string, modelId: string, yearId: string): Promise<FipeDetail | null> => {
    await delay(REQUEST_DELAY_MS);
    console.log(`[FIPE_EXPLORER] Loading detail for ${brandId}/${modelId}/${yearId}...`);
    const detail = await fipeApi.getDetail(type, brandId, modelId, yearId, CACHE_PREFIX);
    console.log(`[FIPE_EXPLORER] Detail loaded: ${detail ? 'SUCCESS' : 'MISS'}`);
    return detail;
  }
};
