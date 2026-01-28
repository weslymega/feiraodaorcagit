import { AdItem, AdStatus } from '../types';

interface FallbackOptions {
    category?: string;
    minItems?: number;
}

/**
 * Seleciona veículos com lógica de fallback inteligente para garantir que a lista nunca fique vazia.
 * 
 * Lógica:
 * 1. Camada 1 (Recentes): Anúncios ordenados por data de criação (limitado a 20).
 * 2. Camada 2 (Destaques): Se a Camada 1 for insuficiente, preenche com destaques ativos da categoria.
 * 3. Camada 3 (Aleatório): Se ainda insuficiente, preenche com anúncios aleatórios da categoria.
 * 
 * Ordenação Final:
 * Premium (4) > Advanced (3) > Basic (2) > Featured (1) > Normal (0)
 * Critério de desempate: Data de criação (mais recente primeiro)
 */
export const getVehiclesWithFallback = (allAds: AdItem[], options: FallbackOptions = {}): AdItem[] => {
    const { category = 'veiculos', minItems = 20 } = options;

    // 1. Filtrar todos os anúncios válidos da categoria
    const validAds = allAds.filter(ad =>
        ad.status === AdStatus.ACTIVE &&
        (category === 'todos' || ad.category === category || ad.category === 'autos')
    );

    // Se não houver anúncios suficientes no total, retorne tudo o que temos ordenado
    if (validAds.length <= minItems) {
        return sortAdsByPriority(validAds);
    }

    // Set para garantir unicidade
    const selectedAdsMap = new Map<string, AdItem>();

    // --- CAMADA 1: Recentes (Top 20 mais novos) ---
    const recentAds = [...validAds]
        .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0).getTime();
            const dateB = new Date(b.createdAt || b.date || 0).getTime();
            return dateB - dateA;
        })
        .slice(0, minItems);

    recentAds.forEach(ad => selectedAdsMap.set(ad.id, ad));

    // --- CAMADA 2: Destaques (Todos os destaques da categoria) ---
    // Se ainda precisarmos de mais relevância ou para garantir que destaques apareçam
    const highlightedAds = validAds.filter(ad =>
        (ad.isFeatured || (ad.boostPlan && ad.boostPlan !== 'gratis')) &&
        !selectedAdsMap.has(ad.id)
    );

    highlightedAds.forEach(ad => selectedAdsMap.set(ad.id, ad));

    // --- CAMADA 3: Fallback Aleatório (Preencher até minItems se necessário) ---
    // Nota: A lógica atual já pega os recentes, então o "aleatório" seria apenas se quiséssemos
    // diversificar além dos recentes. Mas como o objetivo é não deixar vazio, 
    // e já pegamos os 'minItems' mais recentes, essa camada é mais util se aplicarmos filtros restritivos antes.
    // No caso de "sem filtros", os recentes JÁ SÃO o melhor conteúdo.
    // Mas vamos implementar um randomize leve nos que sobraram para dar variedade se solicitado.

    if (selectedAdsMap.size < minItems) {
        const remainingAds = validAds.filter(ad => !selectedAdsMap.has(ad.id));

        // Embaralhar restantes
        const shuffled = [...remainingAds].sort(() => 0.5 - Math.random());

        // Preencher o que falta
        const needed = minItems - selectedAdsMap.size;
        shuffled.slice(0, needed).forEach(ad => selectedAdsMap.set(ad.id, ad));
    }

    // --- ORDENAÇÃO FINAL ---
    return sortAdsByPriority(Array.from(selectedAdsMap.values()));
};

/**
 * Ordena anúncios baseada na prioridade do plano de destaque.
 */
const sortAdsByPriority = (ads: AdItem[]): AdItem[] => {
    return [...ads].sort((a, b) => {
        const getPriority = (item: AdItem) => {
            if (item.boostPlan === 'premium') return 4;
            if (item.boostPlan === 'advanced') return 3;
            if (item.boostPlan === 'basic') return 2;
            if (item.isFeatured) return 1;
            return 0;
        };

        const weightA = getPriority(a);
        const weightB = getPriority(b);

        if (weightA !== weightB) {
            return weightB - weightA;
        }

        // Desempate por data
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
    });
};
