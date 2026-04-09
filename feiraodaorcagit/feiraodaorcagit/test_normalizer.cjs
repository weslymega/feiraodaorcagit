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
    
    // Replace stop words using word boundaries before stripping punctuation
    STOP_WORDS.forEach(word => {
        // escape dot in stop words if any
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

// Test normalizer
console.log("Original: Corolla XEi 1.8/1.8 Flex 16V Aut.");
console.log("Normalized:", normalizeModelName("Corolla XEi 1.8/1.8 Flex 16V Aut."));
console.log("Original: Gol 1.6 MSI Total Flex 5p");
console.log("Normalized:", normalizeModelName("Gol 1.6 MSI Total Flex 5p"));

