
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const AD_ID = '47a28933-0f8f-4b30-b0cd-455c33d6c699';

async function checkDependencies() {
    console.log(`--- Verificando registros vinculados ao Anúncio: ${AD_ID} ---\n`);

    const tablesToCheck = [
        { name: 'payments', column: 'ad_id' },
        { name: 'pagamentos_destaque', column: 'anuncio_id' },
        { name: 'destaques_anuncios', column: 'anuncio_id' },
        { name: 'ad_highlights', column: 'ad_id' },
        { name: 'messages', column: 'ad_id' },
        { name: 'conversations', column: 'ad_id' },
        { name: 'favorites', column: 'ad_id' },
        { name: 'payment_events', column: 'payment_id', isIndirect: true } // payment_id links to pagamentos_destaque
    ];

    for (const table of tablesToCheck) {
        try {
            let count = 0;
            if (table.isIndirect) {
                // Special check for payment_events through pagamentos_destaque
                const { data: pds } = await supabase.from('pagamentos_destaque').select('id').eq('anuncio_id', AD_ID);
                if (pds && pds.length > 0) {
                    const pdIds = pds.map(p => p.id);
                    const { count: c, error } = await supabase
                        .from(table.name)
                        .select('*', { count: 'exact', head: true })
                        .in(table.column, pdIds);
                    count = c || 0;
                }
            } else {
                const { count: c, error } = await supabase
                    .from(table.name)
                    .select('*', { count: 'exact', head: true })
                    .eq(table.column, AD_ID);
                count = c || 0;
            }

            if (count > 0) {
                console.log(`[VINCULADO] Tabela '${table.name}': ${count} registro(s) encontrado(s).`);
            } else {
                console.log(`[LIMPO] Tabela '${table.name}': Nenhum registro.`);
            }
        } catch (err) {
            console.log(`[ERRO] Falha ao verificar tabela '${table.name}': ${err.message}`);
        }
    }
}

checkDependencies();
