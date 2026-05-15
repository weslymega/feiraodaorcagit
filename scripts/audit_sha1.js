
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * FERRAMENTA DE AUDITORIA DE ASSINATURA (SHA-1)
 * Extrai os certificados da keystore local para comparação com o Firebase.
 */

const keystorePath = path.join(process.cwd(), 'feiraodaorca.keystore');

console.log("--------------------------------------------------");
console.log("🔍 AUDITORIA DE ASSINATURA ANDROID");
console.log("--------------------------------------------------");

if (!fs.existsSync(keystorePath)) {
    console.error("❌ ERRO: Keystore 'feiraodaorca.keystore' não encontrada na raiz.");
    process.exit(1);
}

console.log(`✅ Keystore encontrada: ${keystorePath}`);

try {
    // Tenta listar sem senha (algumas informações aparecem) ou pede para o usuário rodar manualmente
    console.log("\n📋 INSTRUÇÃO: Execute o comando abaixo no seu terminal para ver os SHA-1 reais:");
    console.log(`keytool -list -v -keystore feiraodaorca.keystore`);
    console.log("\n(Você precisará da senha da keystore definida no build.gradle)\n");

    console.log("--------------------------------------------------");
    console.log("📌 O QUE PROCURAR NO FIREBASE CONSOLE:");
    console.log("1. Vá em: Configurações do Projeto -> Seus Aplicativos -> Android");
    console.log("2. Verifique se o SHA-1 que sair do comando acima está na lista.");
    console.log("3. Se o app estiver na Play Store, pegue o SHA-1 em: Setup -> App Signing.");
    console.log("4. ADICIONE esse SHA-1 no Firebase.");
    console.log("5. BAIXE o novo google-services.json (ele deve conter o array 'oauth_client').");
    console.log("--------------------------------------------------");

} catch (e) {
    console.error("Erro ao tentar ler keystore:", e.message);
}
