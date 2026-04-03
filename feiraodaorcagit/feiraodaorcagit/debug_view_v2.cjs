const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
    let SUPABASE_URL, SUPABASE_KEY;
    try {
        const envContent = fs.readFileSync('../../.env', 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                const k = key.trim();
                const v = value.trim().replace(/['"]/g, '');
                if (k === 'VITE_SUPABASE_URL') SUPABASE_URL = v;
                // Favor service role if available
                if (k === 'SUPABASE_SERVICE_ROLE_KEY' || k === 'SERVICE_ROLE_KEY' || k === 'VITE_SUPABASE_SERVICE_ROLE_KEY') {
                    SUPABASE_KEY = v;
                }
            }
        });
        
        // Final check on keys
        if (!SUPABASE_KEY) {
            // Re-scan for ANON if no service role
             envContent.split('\n').forEach(line => {
                 const [key, value] = line.split('=');
                 if (key && key.trim() === 'VITE_SUPABASE_ANON_KEY') SUPABASE_KEY = value.trim().replace(/['"]/g, '');
             });
        }
    } catch (e) { }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const adId = '14f907d5-2515-480b-ac26-22cc0adc27ba';
    const future = new Date(Date.now() + 3600000).toISOString();

    console.log(`Updating ${adId} to ${future}... (Using key: ${SUPABASE_KEY.substring(0, 10)}...)`);
    const { data: updateRes, error } = await supabase
        .from('anuncios')
        .update({ turbo_expires_at: future })
        .eq('id', adId)
        .select();
    
    if (error) console.error('Update Error:', error);
    if (!updateRes || updateRes.length === 0) console.warn('Update affected 0 rows!');

    const { data: check } = await supabase.from('anuncios').select('turbo_expires_at').eq('id', adId).single();
    console.log('Fetched after update:', check ? check.turbo_expires_at : 'Ad not found');

    const { data: viewCheck } = await supabase.from('ads_ranked').select('is_turbo_active').eq('id', adId).single();
    console.log('Result in VIEW:', viewCheck ? viewCheck.is_turbo_active : 'Not in view');
}
test();
