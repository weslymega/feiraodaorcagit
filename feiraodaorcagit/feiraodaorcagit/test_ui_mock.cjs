const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// MOCK Vite env vars before importing services
process.env.VITE_SUPABASE_URL = 'https://xkkjjvrucnlilegwnoey.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra2pqdnJ1Y25saWxlZ3dub2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzI0MTUsImV4cCI6MjA4MzcwODQxNX0._zW2u3e8xzNethI1fv70oLTOSeOB7z5tFo77zfS4RZQ';

// Try to use ts-node to execute the TS dynamically
require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs',
        esModuleInterop: true
    }
});

async function runTests() {
    console.log('⏳ Inicializando testes reais na lógica de Preço...');
    try {
        const { marketPriceService } = require('../services/marketPriceService');
        
        // Simular chamada do Dashboard sem favoritos
        console.log('📡 Buscando preços (isso inicializará descoberta dinâmica e cache)...');
        const tsStart = Date.now();
        const results = await marketPriceService.getMarketPrices([]);
        const tsEnd = Date.now();

        console.log('\n--- RESULTADOS GERAIS ---');
        console.log(`Tempo total: ${(tsEnd - tsStart) / 1000}s`);
        
        let foundPrices = 0;
        let fallbacks = 0;

        results.forEach(res => {
            const hasPrice = res.price !== '—';
            if (hasPrice) foundPrices++; else fallbacks++;
            console.log(`[${hasPrice ? '✅ FIPE' : '⚠️ ERR'}] ${res.brand} ${res.model} ${res.year} -> ${res.price}`);
        });

        console.log(`\nResumo: ${foundPrices} Encontrados, ${fallbacks} Em Fallback`);

    } catch(err) {
         console.error('❌ Erro massivo no Teste:', err);
    }
}

runTests();
