const fs = require('fs');

// Read env to get the ANON key and URL using absolute path
const env = fs.readFileSync('C:/Users/machine3/feiraodaorcagit/.env', 'utf-8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim().replace(/['"]/g, '');
const supabaseKey = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/['"]/g, '');

const options = {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey }
};

async function testTrigger() {
    console.log("=========================================");
    console.log("Iniciando Teste do Trigger de Self-Chat...");
    
    // 1. Fetch any one ad
    const adRes = await fetch(supabaseUrl + '/rest/v1/anuncios?limit=1&select=id,user_id', options);
    const adData = await adRes.json();
    if (!adData || adData.length === 0) {
        return console.log("Erro: Nenhum anúncio encontrado para teste.");
    }
    
    const ad = adData[0];
    console.log(`[OK] Anúncio encontrado. ID: ${ad.id} | Dono: ${ad.user_id}`);
    
    const postOptions = {
        method: 'POST',
        headers: { 
            'apikey': supabaseKey, 
            'Authorization': 'Bearer ' + supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            // VERY IMPORTANT: Trying to send a message where sender = owner
            ad_id: ad.id,
            sender_id: ad.user_id, 
            receiver_id: ad.user_id, // Doesn't matter, self chat
            content: "Teste de bypass da API de auto-chat"
        })
    };
    
    console.log(`\n[ACAO] Tentando inserir na tabela 'messages' simulando Self-Chat...`);
    const insertRes = await fetch(supabaseUrl + '/rest/v1/messages', postOptions);
    const insertData = await insertRes.json();
    
    if (!insertRes.ok) {
        console.log(`[SUCESSO] O Banco de Dados bloqueou a requisição!`);
        console.log(`Código HTTP: ${insertRes.status}`);
        console.log(`Mensagem do PostgreSQL: ${insertData.message || (insertData.error && insertData.error.message)}`);
        
        if (JSON.stringify(insertData).includes('SELF_CHAT_NOT_ALLOWED')) {
            console.log("\n✅ VALIDAÇÃO: Trigger funcionou perfeitamente e confirmou 'SELF_CHAT_NOT_ALLOWED'.");
        } else {
            console.log("Nota: Bloqueado, mas verifique se a mensagem acima corresponde ao esperado.");
        }
    } else {
         console.log(`[FALHA DE SEGURANÇA] A mensagem FOI CADASTRADA! O trigger não está ativo ou falhou.`);
         console.log(insertData);
    }
    
    console.log("=========================================\n");
}

testTrigger();
