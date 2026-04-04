const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Path do .env (ajustado para a profundidade do projeto)
let envPath = '../../.env';
if (!fs.existsSync(envPath)) envPath = '.env';

let SUPABASE_URL, SUPABASE_ANON_KEY;
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            const k = key.trim();
            const v = value.trim();
            if (k === 'VITE_SUPABASE_URL' || k === 'SUPABASE_URL') SUPABASE_URL = v;
            if (k === 'VITE_SUPABASE_ANON_KEY' || k === 'SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = v;
        }
    });
} catch (e) { }

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
    console.log("🚀 Verificação Final de Privacidade...");

    // 1. Tentar ler PROFILES (Deve falhar/ser vazio para anon)
    const { data: profiles, error: errP } = await supabase.from('profiles').select('*').limit(5);
    if (errP) {
        console.log("✅ profiles (RLS): BLOQUEADO com sucesso.");
    } else if (profiles && profiles.length > 0) {
        console.warn("⚠️ profiles (RLS): Ainda retornando dados! Verifique se rodou o SQL.");
    } else {
        console.log("✅ profiles (RLS): Lista vazia (OK).");
    }

    // 2. Tentar ler PUBLIC_PROFILES (Deve funcionar)
    const { data: publicP, error: errPP } = await supabase.from('public_profiles').select('*').limit(1);
    if (errPP) {
        console.error("❌ public_profiles: Erro!", errPP.message);
    } else if (publicP && publicP.length > 0) {
        console.log("✅ public_profiles: Acessível.");
        const leaked = ['email', 'is_admin', 'role', 'phone', 'is_blocked'].filter(c => publicP[0].hasOwnProperty(c));
        if (leaked.length > 0) {
            console.error("❌ public_profiles: VAZAMENTO! Colunas proibidas:", leaked.join(', '));
        } else {
            console.log("✅ public_profiles: Filtrado corretamente (apenas dados públicos).");
        }
    }

    // 3. Simular Join (O que o app faz)
    console.log("\n--- TESTE DE JOINS (Marketplace) ---");
    const { data: ads, error: errAds } = await supabase
        .from('anuncios')
        .select('titulo, public_profiles!user_id(name)')
        .eq('status', 'active')
        .limit(1);
    
    if (errAds) {
        console.error("❌ Join: Falhou!", errAds.message);
    } else if (ads && ads.length > 0) {
        console.log("✅ Join: Funcionando.");
        console.log("Dono do anúncio:", ads[0].public_profiles?.name || "N/A");
    }
}

verify();
