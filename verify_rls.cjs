
const { createClient } = require('@supabase/supabase-js');

// Credentials from .env
const SUPABASE_URL = 'https://xkkjjvrucnlilegwnoey.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ikG9UCkUNfe6nqQEaxgvoQ_0PmEr7sl';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyPublicAds() {
    console.log('🔍 Testando leitura pública de anúncios...');
    const { data, error } = await supabase
        .from('anuncios') // Note: based on previous edits, the table name is 'anuncios'
        .select('*')
        .eq('status', 'active')
        .limit(1);

    if (error) {
        console.error('❌ Erro ao buscar anúncios:', error.message);
        process.exit(1);
    }

    if (data && data.length > 0) {
        console.log('✅ Sucesso: Anúncios públicos continuam visíveis.');
        console.log('Exemplo de anúncio encontrado:', data[0].titulo || data[0].title);
    } else {
        console.warn('⚠️ Nenhum anúncio "active" encontrado, mas a query foi bem-sucedida (sem erro de RLS).');
    }
}

verifyPublicAds();
