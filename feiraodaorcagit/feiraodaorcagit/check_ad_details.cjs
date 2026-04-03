const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function check() {
    let SUPABASE_URL, SUPABASE_ANON_KEY;
    try {
        const envContent = fs.readFileSync('../../.env', 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                if (key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = value.trim();
                if (key.trim() === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.trim();
            }
        });
    } catch (e) { }

    const supabase = createClient(SUPABASE_URL.replace(/['"]/g, ''), SUPABASE_ANON_KEY.replace(/['"]/g, ''));

    const { data: ad } = await supabase.from('anuncios').select('id, titulo, status, turbo_expires_at').eq('id', '14f907d5-2515-480b-ac26-22cc0adc27ba').single();
    console.log('Ad Status:', ad.status);
    console.log('Turbo Expires At:', ad.turbo_expires_at);

    // Try view again
    const { data: rankedAd } = await supabase.from('ads_ranked').select('*').eq('id', ad.id).single();
    console.log('Ranked Ad exists in view?', !!rankedAd);
    if (rankedAd) console.log('is_turbo_active in view:', rankedAd.is_turbo_active);
}
check();
