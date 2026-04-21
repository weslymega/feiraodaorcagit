
/**
 * FEIRÃO DA ORCA - Script de Limpeza Definitiva (35 Dias)
 * Este script substitui a Edge Function para ambientes sem Docker.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env MANUALMENTE para evitar dependências extras como 'dotenv'
function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    });
    return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
// IMPORTANTE: Adicione a SERVICE_ROLE_KEY no seu .env se não existir
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Erro: SUPABASE_URL ou SERVICE_ROLE_KEY não encontrados.');
    console.log('Certifique-se de que seu .env tem:');
    console.log('VITE_SUPABASE_URL=https://... (já deve existir)');
    console.log('SUPABASE_SERVICE_ROLE_KEY=... (pegue no painel do Supabase -> Project Settings -> API)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Configurações de Segurança
const DRY_RUN = process.env.DRY_RUN !== 'false';
const DELETION_LIMIT = 50;

async function cleanupExpiredAds() {
    console.log('🚀 Iniciando faxina manual de anúncios expirados (35 dias)...');
    if (DRY_RUN) console.log('⚠️ MODO SIMULAÇÃO (DRY_RUN): Nenhuma deleção real será feita.');

    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    let totalProcessed = 0;
    let totalDeleted = 0;
    let hasMore = true;
    const skippedIds = new Set();

    while (hasMore && totalDeleted < DELETION_LIMIT) {
        // 1. Buscar anúncios antigos (Status deve ser 'expired')
        const { data: anuncios, error: fetchError } = await supabase
            .from('anuncios')
            .select('id, user_id, titulo, status')
            .eq('status', 'expired') // Regra de Hardening: Só deleta se já estiver marcado como expirado
            .lt('created_at', thirtyFiveDaysAgo.toISOString())
            .not('id', 'in', `(${Array.from(skippedIds).join(',') || '00000000-0000-0000-0000-000000000000'})`)
            .limit(20); // Buscamos em lotes menores para controle fino

        if (fetchError) {
            console.error('❌ Erro ao buscar anúncios:', fetchError.message);
            break;
        }

        if (!anuncios || anuncios.length === 0) {
            if (totalDeleted === 0) {
                console.log('✅ Nenhum anúncio com status "expired" e mais de 35 dias encontrado.');
            }
            hasMore = false;
            break;
        }

        console.log(`\n🔍 Analisando lote de ${anuncios.length} anúncios...`);

        for (const anuncio of anuncios) {
            if (totalDeleted >= DELETION_LIMIT) {
                console.log(`\n🛑 Limite de segurança de ${DELETION_LIMIT} deleções atingido. Interrompendo.`);
                hasMore = false;
                break;
            }

            // Validação de Caminho (Hardening)
            if (!anuncio.user_id || !anuncio.id) {
                console.log(`   ⚠️ Dados inválidos para o anúncio ${anuncio.id}. Pulando.`);
                skippedIds.add(anuncio.id);
                continue;
            }

            const folderPath = `${anuncio.user_id}/${anuncio.id}`;
            console.log(`\n📦 Processando: "${anuncio.titulo}" (ID: ${anuncio.id})`);

            try {
                // A. Listar e Remover Imagens do Storage
                const { data: files, error: listError } = await supabase.storage
                    .from('ads-images')
                    .list(folderPath);

                if (!listError && files && files.length > 0) {
                    const filePaths = files.map(f => `${folderPath}/${f.name}`);
                    console.log(`   🗑️ Identificadas ${files.length} imagens no storage.`);
                    
                    if (!DRY_RUN) {
                        const { error: storageError } = await supabase.storage
                            .from('ads-images')
                            .remove(filePaths);

                        if (storageError) {
                            console.error(`   ⚠️ Erro ao remover do Storage: ${storageError.message}`);
                            await logAction(anuncio.id, anuncio.user_id, 'error', `Erro Storage: ${storageError.message}`, anuncio.titulo);
                            skippedIds.add(anuncio.id);
                            continue; 
                        }
                    } else {
                        console.log(`   [SIMULAÇÃO] Executaria remoção de: ${filePaths.join(', ')}`);
                    }
                }

                // B. Deletar Registro no Banco
                if (!DRY_RUN) {
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
                    console.log(`   ✅ Limpeza completa realizada.`);
                } else {
                    console.log(`   [SIMULAÇÃO] Executaria deleção do registro ID: ${anuncio.id}`);
                }

                totalDeleted++;
                totalProcessed++;
                if (!DRY_RUN) await logAction(anuncio.id, anuncio.user_id, 'success', null, anuncio.titulo);

            } catch (err) {
                console.error(`   💥 Erro inesperado: ${err.message}`);
                skippedIds.add(anuncio.id);
            }
        }
    }

    console.log(`\n✨ Fim da execução. Total processado: ${totalProcessed} | Total deletado (real): ${DRY_RUN ? 0 : totalDeleted}`);
}

async function logAction(adId, ownerId, status, errorMsg, title = null) {
    if (DRY_RUN) return; // Não logamos no banco em modo simulação
    await supabase.from('ad_cleanup_logs').insert({
        ad_id: adId,
        owner_id: ownerId,
        title: title,
        status: status,
        error_message: errorMsg
    });
}

cleanupExpiredAds();
