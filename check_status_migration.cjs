const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabaseStatus() {
    console.log('🔍 Verificando Status do Banco de Dados...\n');

    try {
        // 1. Check if there are any ads
        const { data: allAds, error: allError } = await supabase
            .from('anuncios')
            .select('id, titulo, status, categoria')
            .limit(10);

        if (allError) {
            console.error('❌ Erro ao buscar anúncios:', allError.message);
            return;
        }

        console.log(`📊 Total de anúncios (amostra): ${allAds?.length || 0}\n`);

        if (allAds && allAds.length > 0) {
            console.log('📋 Status encontrados no banco:');
            const statusCounts = {};
            allAds.forEach(ad => {
                statusCounts[ad.status] = (statusCounts[ad.status] || 0) + 1;
            });
            console.table(statusCounts);

            console.log('\n🔍 Primeiros 5 anúncios:');
            allAds.slice(0, 5).forEach(ad => {
                console.log(`  - ${ad.titulo} | Status: "${ad.status}" | Categoria: ${ad.categoria}`);
            });
        } else {
            console.log('⚠️ Nenhum anúncio encontrado no banco!');
        }

        // 2. Check for active ads (English)
        const { data: activeAds, error: activeError } = await supabase
            .from('anuncios')
            .select('id, titulo, status')
            .eq('status', 'active')
            .limit(5);

        console.log(`\n✅ Anúncios com status='active': ${activeAds?.length || 0}`);

        // 3. Check for Portuguese status
        const { data: ativoAds, error: ativoError } = await supabase
            .from('anuncios')
            .select('id, titulo, status')
            .eq('status', 'ativo')
            .limit(5);

        console.log(`⚠️ Anúncios com status='ativo' (PT): ${ativoAds?.length || 0}`);

        // 4. Check for pending ads
        const { data: pendingAds } = await supabase
            .from('anuncios')
            .select('id, titulo, status')
            .eq('status', 'pending')
            .limit(5);

        console.log(`📝 Anúncios com status='pending': ${pendingAds?.length || 0}`);

        const { data: pendenteAds } = await supabase
            .from('anuncios')
            .select('id, titulo, status')
            .eq('status', 'pendente')
            .limit(5);

        console.log(`⚠️ Anúncios com status='pendente' (PT): ${pendenteAds?.length || 0}`);

        // 5. Migration recommendation
        console.log('\n🚨 AÇÃO NECESSÁRIA:');
        if ((ativoAds?.length || 0) > 0 || (pendenteAds?.length || 0) > 0) {
            console.log('❌ O banco ainda contém status em PORTUGUÊS!');
            console.log('\n📝 Execute este SQL no Supabase SQL Editor:\n');
            console.log(`UPDATE anuncios SET status = 'pending' WHERE status = 'pendente';`);
            console.log(`UPDATE anuncios SET status = 'active' WHERE status = 'ativo';`);
            console.log(`UPDATE anuncios SET status = 'rejected' WHERE status = 'rejeitado';`);
            console.log(`UPDATE anuncios SET status = 'inactive' WHERE status = 'inativo';`);
            console.log(`UPDATE anuncios SET status = 'sold' WHERE status = 'vendido';`);
        } else {
            console.log('✅ Todos os status estão em INGLÊS!');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkDatabaseStatus();
