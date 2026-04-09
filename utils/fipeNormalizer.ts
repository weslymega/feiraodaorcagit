/**
 * FIPE Normalizer and String Similarity Utilities
 */

// List of common trims/versions that interfere with base model matching
const STOP_WORDS = [
  'xei', 'xli', 'gli', 'altis', 'gr-s', 'xre', 'xrv', 'xrx', 'se-g', 's', 'le', 'dx', // Toyota
  'lt', 'ltz', 'ls', 'premier', 'rs', 'activ', 'joy', // GM
  'trend', 'trendline', 'comfortline', 'highline', 'gti', 'gts', 'msi', 'tsi', // VW
  'attractive', 'essence', 'sporting', 'way', 'trekking', 'volcano', 'ranch', 'ultra', // Fiat
  'titanium', 'se', 'sel', 'freestyle', 'plus', // Ford
  'ex', 'exl', 'lx', 'touring', 'si', // Honda
  'vision', 'evolution', 'platinum', 'sport', 'diamond', // Hyundai/Others
  '1.0', '1.3', '1.4', '1.5', '1.6', '1.8', '2.0', '2.2', '2.4', '2.5', '2.8', '3.0',
  '8v', '16v', '24v',
  'flex', 'gasolina', 'alcool', 'diesel', 'hibrido', 'híbrido', 'turbo',
  'aut', 'aut.', 'mec', 'mec.', 'cvt', 'manual', 'automatico', 'automático',
  '4x4', '4x2', 'awd', '4wd'
];

export const fipeNormalizer = {
  /**
   * Normalizes a string by converting to lowercase, removing accents, special chars,
   * and strategically removing known trim levels/engine specs that mess up the FIPE API matching.
   */
  normalizeModelName: (name: string): string => {
    if (!name) return '';
    
    // 1. Lowercase and basic trim
    let normalized = name.toLowerCase().trim();
    
    // 2. Remove accents
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // 3. Remove stop words BEFORE removing punctuation, keeping dot/word boundaries
    STOP_WORDS.forEach(word => {
        let w = word.replace(/\./g, '\\.');
        normalized = normalized.replace(new RegExp(`\\b${w}\\b`, 'gi'), ' ');
    });
    
    // 4. Remove punctuation and special characters
    normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
    
    // 5. Tokenize
    let tokens = normalized.split(/\s+/).filter(Boolean);
    
    // 6. Provide a fallback if removing stop words cleared the whole string
    if (tokens.length === 0) {
       return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)[0] || '';
    }
    
    return tokens.join(' ');
  },

  normalizeBrandName: (name: string): string => {
    if (!name) return '';
    let normalized = name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Specific business rules for FIPE anomalies
    if (normalized.includes('vw') || normalized.includes('volkswagen')) return 'vw - volkswagen';
    if (normalized.includes('gm') || normalized.includes('chevrolet')) return 'gm - chevrolet';
    
    return normalized;
  },

  /**
   * Calculates Levenshtein Distance between two strings.
   * Returns a value between 0 (exact match) to 1 (completely different).
   */
  getLevenshteinDistance: (a: string, b: string): number => {
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = [];

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
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
    
    // Normalize to 0-1 range (0 = exactly similar, 1 = extremely different)
    return maxLength === 0 ? 0 : distance / maxLength;
  },

  /**
   * Finds the best match in an array of items based on a target string.
   */
  findBestMatch: <T>(
    items: T[], 
    target: string, 
    keyAccessor: (item: T) => string, 
    threshold: number = 0.6 // 0 is perfect, 1 is totally different
  ): T | null => {
    if (!items || items.length === 0 || !target) return null;
    
    const targetNorm = fipeNormalizer.normalizeModelName(target);
    
    let bestMatch: T | null = null;
    let bestScore = 1.0; // Worst possible score
    
    for (const item of items) {
      const itemKey = keyAccessor(item);
      const itemNorm = fipeNormalizer.normalizeModelName(itemKey);
      
      // Exact match after normalization (score 0)
      if (targetNorm === itemNorm) {
          return item;
      }
      
      // Substring match (strong indicator, but check distance to pick best of multiple substrings)
      const isSubstring = itemNorm.includes(targetNorm) || targetNorm.includes(itemNorm);
      
      const distance = fipeNormalizer.getLevenshteinDistance(targetNorm, itemNorm);
      
      // If it's a substring match, we give it a massive boost 
      // (e.g. searching for "Corolla" in "Corolla Altis")
      const finalScore = isSubstring ? distance * 0.3 : distance;

      if (finalScore < bestScore && finalScore <= threshold) {
        bestScore = finalScore;
        bestMatch = item;
      }
    }
    
    return bestMatch;
  }
};
