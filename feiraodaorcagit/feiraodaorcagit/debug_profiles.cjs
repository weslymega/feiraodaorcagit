const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function debugProfiles() {
    let SUPABASE_URL, SUPABASE_ANON_KEY;
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...rest] = line.split('=');
            const value = rest.join('=');
            if (key && value) {
                if (key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = value.trim().replace(/['"]/g, '');
                if (key.trim() === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.trim().replace(/['"]/g, '');
            }
        });
    } catch (e) { 
        console.error('Erro ao ler .env:', e.message); 
        return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Variáveis de ambiente não encontradas.');
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('--- Verificando Colunas da Tabela PROFILES ---');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
        console.error('Erro na consulta:', error);
        return;
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('Colunas encontradas:', columns);
        
        const hasAcceptedTerms = columns.includes('accepted_terms');
        const hasAcceptedAt = columns.includes('accepted_at');
        
        console.log('accepted_terms existe?', hasAcceptedTerms);
        console.log('accepted_at existe?', hasAcceptedAt);
    } else {
        console.log('Nenhum perfil encontrado para verificar colunas via select *');
    }
}

debugProfiles();
