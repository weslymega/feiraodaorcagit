import { fipeApi } from './fipeApi';
import { MarketPriceItem, AdItem } from '../types';

const POPULAR_MODELS = [
  { brand: 'Toyota', model: 'Corolla', brandId: '56', modelId: '900', yearId: '2020-1', year: '2020' },
  { brand: 'Honda', model: 'Civic', brandId: '25', modelId: '127', yearId: '2016-1', year: '2016' },
  { brand: 'VW', model: 'Gol', brandId: '59', modelId: '205', yearId: '2018-1', year: '2018' },
  { brand: 'GM', model: 'Onix', brandId: '23', modelId: '6175', yearId: '2019-1', year: '2019' },
  { brand: 'Hyundai', model: 'HB20', brandId: '26', modelId: '6013', yearId: '2017-1', year: '2017' }
];

export const marketPriceService = {
  getMarketPrices: async (favorites: AdItem[] = []): Promise<MarketPriceItem[]> => {
    try {
      // 1. Extract unique brand/model pairs from favorites for personalization
      const prioritized = favorites
        .filter(ad => ad.category === 'veiculos' || ad.category === 'autos')
        .map(ad => ({
           brand: ad.title.split(' ')[0], 
           model: ad.title.split(' ')[1],
           year: ad.year?.toString() || '2020'
        }))
        .slice(0, 3);

      // 2. Combine with popular fallback (and deduplicate)
      // For now, to keep it fast and reliable, we'll fetch details for the hardcoded popular items
      // This ensures "FIPE REAL" data without complex discovery on every dashboard load.
      
      const results: any[] = [];
      const itemsToFetch = [...POPULAR_MODELS];

      // Fetch sequencial para evitar bloqueio por limitação de taxa (anti-flood)
      for (const item of itemsToFetch) {
        try {
          const detail = await fipeApi.getDetail('carros', item.brandId, item.modelId, item.yearId);
          if (detail) {
            results.push({
              id: `fipe-${detail.CodigoFipe}-${item.year}`,
              brand: detail.Marca,
              model: detail.Modelo,
              year: item.year,
              price: detail.Valor,
              brandId: item.brandId,
              modelId: item.modelId
            });
          } else {
            // Em caso de retorno nulo (falha blindada da API FIPE)
            results.push({
              id: `err-mock-${item.modelId}-${item.year}`,
              brand: item.brand,
              model: item.model,
              year: item.year,
              price: '—',
              label: 'Preço indisponível',
              fallback: true,
              brandId: item.brandId,
              modelId: item.modelId
            });
          }
        } catch (e) {
          // Fallback de segurança extremo
          results.push({
            id: `err-mock-${item.modelId}-${item.year}`,
            brand: item.brand,
            model: item.model,
            year: item.year,
            price: '—',
            label: 'Preço indisponível',
            fallback: true,
            brandId: item.brandId,
            modelId: item.modelId
          });
        }

        // Delay inteligente de ~200ms entre as requisições (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return results;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("[FIPE] Falha inesperada no MarketPriceService", error);
      }
      // Fallback radical em caso de erro total na orquestração
      return POPULAR_MODELS.map(m => ({
        id: `err-mock-${m.modelId}`,
        brand: m.brand,
        model: m.model,
        year: m.year,
        price: '—',
        label: 'Preço indisponível',
        fallback: true,
        brandId: m.brandId,
        modelId: m.modelId
      } as any));
    }
  }
};
