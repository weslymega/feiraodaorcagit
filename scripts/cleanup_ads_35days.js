
/**
 * FEIRÃO DA ORCA - Script de Limpeza Definitiva (35 Dias)
 * Este script substitui a Edge Function para ambientes sem Docker.
 * 
 * Executa:
 * 1. Busca anúncios com mais de 35 dias.
 * 2. Remove todas as imagens do Storage (ads-images).
 * 3. Deleta o registro no banco de dados (anuncios).
 * 4. Registra log na tabela ad_cleanup_logs.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: Para deletar anúncios de outros usuários e acessar o Storage,
// é necessário a SERVICE_ROLE_KEY (não a anon key).
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
    console.log('Certifique-se de adicionar SUPABASE_SERVICE_ROLE_KEY ao seu arquivo .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function cleanupExpiredAds() {
    console.log('🚀 Iniciando faxina manual de anúncios expirados (35 dias)...');

    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    let totalProcessed = 0;
    let hasMore = true;
    const skippedIds = new Set();

    while (hasMore) {
        // 1. Buscar anúncios antigos (Lote de 100)
        const { data: anuncios, error: fetchError } = await supabase
            .from('anuncios')
            .select('id, user_id, titulo')
            .lt('created_at', thirtyFiveDaysAgo.toISOString())
            .not('id', 'in', `(${Array.from(skippedIds).join(',') || '00000000-0000-0000-0000-000000000000'})`)
            .limit(100);

        if (fetchError) {
            console.error('❌ Erro ao buscar anúncios:', fetchError.message);
            break;
        }

        if (!anuncios || anuncios.length === 0) {
            if (totalProcessed === 0) {
                console.log('✅ Nenhum anúncio com mais de 35 dias encontrado.');
            } else {
                console.log(`\n✨ Faxina concluída! Total de anúncios removidos: ${totalProcessed}`);
            }
            hasMore = false;
            break;
        }

        console.log(`\n🔍 Lote encontrado: ${anuncios.length} anúncios. Iniciando processamento...`);

        for (const anuncio of anuncios) {
            const folderPath = `${anuncio.user_id}/${anuncio.id}`;
            console.log(`\n📦 Processando: "${anuncio.titulo}" (ID: ${anuncio.id})`);

            try {
                // A. Listar e Remover Imagens do Storage
                const { data: files, error: listError } = await supabase.storage
                    .from('ads-images')
                    .list(folderPath);

                if (!listError && files && files.length > 0) {
                    const filePaths = files.map(f => `${folderPath}/${f.name}`);
                    console.log(`   🗑️ Removendo ${files.length} imagens de storage...`);
                    
                    const { error: storageError } = await supabase.storage
                        .from('ads-images')
                        .remove(filePaths);

                    if (storageError) {
                        console.error(`   ⚠️ Erro no Storage: ${storageError.message}`);
                        await logAction(anuncio.id, anuncio.user_id, 'error', `Erro Storage: ${storageError.message}`, anuncio.titulo);
                        continue; 
                    }
                }

                // B. Deletar Registro no Banco
                const { error: dbError } = await supabase
                    .from('anuncios')
                    .delete()
                    .eq('id', anuncio.id);

                if (dbError) {
                    console.error(`   ⚠️ Erro ao deletar no banco: ${dbError.message}`);
                    await logAction(anuncio.id, anuncio.user_id, 'error', `Erro Banco: ${dbError.message}`, anuncio.titulo);
                    skippedIds.add(anuncio.id); // Evita loop infinito
                    continue;
                }

                // C. Log de Sucesso
                console.log(`   ✅ Limpeza completa realizada.`);
                await logAction(anuncio.id, anuncio.user_id, 'success', null, anuncio.titulo);
                totalProcessed++;

            } catch (err) {
                console.error(`   💥 Erro inesperado: ${err.message}`);
            }
        }
    }
}

async function logAction(adId, ownerId, status, errorMsg, title = null) {
    await supabase.from('ad_cleanup_logs').insert({
        ad_id: adId,
        owner_id: ownerId,
        title: title,
        status: status,
        error_message: errorMsg
    });
}

cleanupExpiredAds();
