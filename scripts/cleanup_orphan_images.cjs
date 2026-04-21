/**
 * FEIRÃO DA ORCA - Limpeza de Imagens Órfãs
 * Remove pastas no storage que não possuem anúncios correspondentes no banco.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) return process.env;
    const content = fs.readFileSync(envPath, 'utf8');
    const env = { ...process.env };
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY);

// Configurações de Segurança
const DRY_RUN = process.env.DRY_RUN !== 'false';
const FOLDER_LIMIT = 20; // Limite de pastas processadas por vez para evitar timeout
const AGE_THRESHOLD_HOURS = 48; // Hardening: Só deleta se tiver mais de 48h

async function cleanupOrphans() {
    console.log('🔥 Iniciando limpeza de imagens órfãs no Storage...');
    if (DRY_RUN) console.log('⚠️ MODO SIMULAÇÃO (DRY_RUN): Nenhuma deleção real será feita.');

    try {
        // 1. Listar pastas de usuários (Nível 1)
        const { data: userFolders, error: userError } = await supabase.storage
            .from('ads-images')
            .list('', { limit: 100 });

        if (userError) throw userError;

        let processedFolders = 0;
        let deletedFolders = 0;

        for (const userFolder of userFolders) {
            if (processedFolders >= FOLDER_LIMIT) break;
            if (userFolder.name === '.emptyFolderPlaceholder') continue;

            // 2. Listar pastas de anúncios do usuário (Nível 2)
            const { data: adFolders, error: adError } = await supabase.storage
                .from('ads-images')
                .list(userFolder.name);

            if (adError) continue;

            for (const adFolder of adFolders) {
                if (processedFolders >= FOLDER_LIMIT) break;
                
                const adId = adFolder.name;
                // Validar se é um UUID (básico) para evitar caminhos errados
                if (adId.length < 30) continue; 

                // 3. Verificar se o anúncio existe no banco
                const { data: anuncio, error: dbError } = await supabase
                    .from('anuncios')
                    .select('id')
                    .eq('id', adId)
                    .single();

                // Se o anúncio não existe (anuncio é null)
                if (!anuncio) {
                    const fullPath = `${userFolder.name}/${adId}`;
                    
                    // 4. Verificar idade dos arquivos na pasta
                    const { data: files, error: filesError } = await supabase.storage
                        .from('ads-images')
                        .list(fullPath);

                    if (filesError || !files || files.length === 0) {
                        // Pasta vazia ou erro, vamos tentar remover a pasta em si se possível
                        // No Supabase, deletar todos os arquivos remove a "pasta"
                        continue;
                    }

                    // Hardening: Verificar se TODOS os arquivos na pasta têm mais de 48h
                    const now = new Date();
                    const allOldEnough = files.every(file => {
                        const fileDate = new Date(file.created_at);
                        const ageInHours = (now - fileDate) / (1000 * 60 * 60);
                        return ageInHours > AGE_THRESHOLD_HOURS;
                    });

                    if (allOldEnough) {
                        console.log(`\n🚨 ÓRFÃO DETECTADO: Pasta "${fullPath}" (Referência não encontrada no banco)`);
                        console.log(`   - Arquivos: ${files.length} | Idade: >${AGE_THRESHOLD_HOURS}h`);

                        if (!DRY_RUN) {
                            const filePaths = files.map(f => `${fullPath}/${f.name}`);
                            const { error: delError } = await supabase.storage
                                .from('ads-images')
                                .remove(filePaths);

                            if (delError) {
                                console.error(`   ❌ Erro ao deletar: ${delError.message}`);
                            } else {
                                console.log(`   ✅ Pasta removida com sucesso.`);
                                deletedFolders++;
                            }
                        } else {
                            console.log(`   [SIMULAÇÃO] Executaria a remoção de ${files.length} arquivos.`);
                        }
                        processedFolders++;
                    } else {
                        console.log(`   ⏭️ Ignorando "${fullPath}": Arquivos recentes (<${AGE_THRESHOLD_HOURS}h).`);
                    }
                }
            }
        }

        console.log(`\n✨ Limpeza de órfãos finalizada.`);
        console.log(`- Pastas analisadas: ${processedFolders}`);
        console.log(`- Pastas removidas (real): ${DRY_RUN ? 0 : deletedFolders}`);

    } catch (err) {
        console.error('❌ Erro fatal na limpeza de órfãos:', err.message);
    }
}

cleanupOrphans();
