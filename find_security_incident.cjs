
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xkkjjvrucnlilegwnoey.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra2pqdnJ1Y25saWxlZ3dub2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzI0MTUsImV4cCI6MjA4MzcwODQxNX0._zW2u3e8xzNethI1fv70oLTOSeOB7z5tFo77zfS4RZQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findIncident() {
    console.log("🔍 Verificando se existem logs na tabela security_logs...");
    
    const { data, error, count } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact' })
        .limit(5)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Erro:", error);
        return;
    }

    console.log(`✅ Total de logs encontrados: ${count}`);
    console.log("Últimos 5 logs:");
    console.log(JSON.stringify(data, null, 2));
}

findIncident();
