const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
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

    const adId = '14f907d5-2515-480b-ac26-22cc0adc27ba';
    const future = new Date(Date.now() + 3600000).toISOString();

    console.log(`Updating ${adId} to ${future}...`);
    const { count, error } = await supabase
        .from('anuncios')
        .update({ turbo_expires_at: future })
        .eq('id', adId)
        .select(); // Ensure we selective. wait, select() returns data.
    
    if (error) console.error('Update Error:', error);
    console.log('Update result data:', count); // wait, it's .select()

    const { data: check } = await supabase.from('anuncios').select('turbo_expires_at').eq('id', adId).single();
    console.log('Fetched after update:', check.turbo_expires_at);

    const { data: viewCheck } = await supabase.from('ads_ranked').select('is_turbo_active').eq('id', adId).single();
    console.log('Result in VIEW:', viewCheck.is_turbo_active);
}
test();
