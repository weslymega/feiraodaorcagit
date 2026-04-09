import { fipeApi } from './fipeApi';
import { MarketPriceItem, AdItem } from '../types';
import { supabase } from './api';

// Instead of hardcoded IDs, we now use string names as the source of truth.
const POPULAR_MODELS_NAMES = [
  { brand: 'Toyota', model: 'Corolla', year: '2020' },
  { brand: 'Honda', model: 'Civic', year: '2016' },
  { brand: 'VW', model: 'Gol', year: '2018' },
  { brand: 'GM', model: 'Onix', year: '2019' },
  { brand: 'Hyundai', model: 'HB20', year: '2017' },
  { brand: 'Fiat', model: 'Strada', year: '2024' },
  { brand: 'Fiat', model: 'Argo', year: '2024' },
  { brand: 'VW', model: 'Polo', year: '2024' },
  { brand: 'Ford', model: 'Ka', year: '2020' },
  { brand: 'Renault', model: 'Kwid', year: '2024' }
];

// Concurrency control for market prices to prevent dupe API calls for the same car
const pricePendingRequests = new Map<string, Promise<any>>();

export const marketPriceService = {
  getMarketPrices: async (favorites: AdItem[] = []): Promise<MarketPriceItem[]> => {
    try {
      // 1. Extract unique brand/model pairs from favorites for personalization
      const prioritized = favorites
        .filter(ad => ad.category === 'veiculos' || ad.category === 'autos')
        .map(ad => ({
           brand: ad.title.split(' ')[0], 
           model: ad.title.split(' ').slice(1, 3).join(' '), // Better model extraction
           year: ad.year?.toString() || '2020'
        }))
        .slice(0, 3);

      const itemsToFetch = [...prioritized];
      
      // Fill the rest with popular models up to 10 items
      for (const pop of POPULAR_MODELS_NAMES) {
        if (itemsToFetch.length >= 10) break;
        if (!itemsToFetch.some(i => i.brand === pop.brand && i.model === pop.model)) {
          itemsToFetch.push(pop);
        }
      }

      const results: MarketPriceItem[] = [];

      // Fetch sequential to avoid rate limits
      for (const item of itemsToFetch) {
        try {
          const cacheKeyBase = `fipe_price_${item.brand}_${item.model}_${item.year}`.toLowerCase().replace(/\s+/g, '_');
          
          // 1. Check DB Cache First (ULTIMATE SOURCE OF TRUTH)
          const { data: dbCache } = await supabase
             .from('fipe_cache')
             .select('data')
             .eq('key', cacheKeyBase)
             .maybeSingle();

          if (dbCache && dbCache.data) {
             results.push({
                id: cacheKeyBase,
                brand: item.brand, // Do not use dbCache data here because we want the shortened alias for UI/search
                model: item.model, 
                year: item.year,
                price: dbCache.data.Valor,
                label: 'Preço Médio'
             } as any);
             continue; // Move to next item!
          }

          // 2. Not in cache? Execute Dynamic Discovery Pipeline
          
          // A. Find Brand ID
          const brandId = await fipeApi.findBrandIdByName('carros', item.brand);
          if (!brandId) throw new Error(`Brand not found: ${item.brand}`);

          // B/C. Find Model ID and Year ID (With Candidate Fallbacks explicitly inside API)
          const ids = await fipeApi.findBestModelAndYearId('carros', brandId, item.model, item.year);
          if (!ids) throw new Error(`Model/Year combination not found for: ${item.model} ${item.year}`);

          const { modelId, yearId } = ids;

          // D. Fetch the actual detail using the discovered IDs
          const detail = await fipeApi.getDetail('carros', brandId, modelId, yearId);
          
          if (detail && detail.Valor) {
            // Save to the semantic key cache for immediate reuse next time
            supabase.from('fipe_cache').upsert({
              key: cacheKeyBase,
              marca: brandId,
              modelo: modelId,
              ano: yearId,
              data: detail
            }, { onConflict: 'key' }).then();

            results.push({
              id: cacheKeyBase,
              brand: item.brand, // Use original short name for UI brevity and Search
              model: item.model, // Use original short name for UI brevity and Search
              year: item.year, // Requested year or fallback year string
              price: detail.Valor,
              brandId,
              modelId
            } as any);
          } else {
             throw new Error('Detail returned null');
          }

        } catch (e) {
          // Fallback on failure (creates the 'Preço indisponível' skeleton for the UI)
          results.push({
            id: `err-mock-${item.model.replace(/\s/g, '')}-${item.year}`,
            brand: item.brand,
            model: item.model,
            year: item.year,
            price: '—',
            label: 'Preço indisponível',
            fallback: true
          } as any);
        }

        // Intelligent delay to prevent API flooding
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return results;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("[FIPE] Unexpected failure in MarketPriceService", error);
      }
      return POPULAR_MODELS_NAMES.map(m => ({
        id: `fatal-err-${m.model}`,
        brand: m.brand,
        model: m.model,
        year: m.year,
        price: '—',
        label: 'Preço indisponível',
        fallback: true
      } as any));
    }
  }
};
