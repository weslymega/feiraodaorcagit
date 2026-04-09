const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xkkjjvrucnlilegwnoey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra2pqdnJ1Y25saWxlZ3dub2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzI0MTUsImV4cCI6MjA4MzcwODQxNX0._zW2u3e8xzNethI1fv70oLTOSeOB7z5tFo77zfS4RZQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyTable() {
    console.log('🔍 Testando acesso a tabela fipe_lists_cache...');
    
    const { data: insertData, error: insertError } = await supabase
        .from('fipe_lists_cache')
        .upsert({
            type: 'brands',
            key: 'test_key',
            data: { test: true }
        }, { onConflict: 'key' });

    if (insertError) {
        console.error('❌ Erro de inserção:', insertError.message);
    } else {
        console.log('✅ Inserção permitida com sucesso.');
    }

    const { data, error } = await supabase
        .from('fipe_lists_cache')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Erro ao buscar:', error.message);
        process.exit(1);
    }

    if (data) {
        console.log('✅ Sucesso: Tabela acessível na API REST.');
        console.log('Registros encontrados:', data.length);
    }
}

verifyTable();
