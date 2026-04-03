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

    const { data, error } = await supabase.rpc('get_now_test'); // I'll try to use a select if possible
    // Since I can't run raw SQL easily via JS client, I'll try to get it from a table if possible or use a known RPC.
    
    // Actually, I'll try to fetch an ad and see the turbo_expires_at I just set.
    const { data: ad } = await supabase.from('anuncios').select('turbo_expires_at').limit(1).single();
    console.log('Value in DB:', ad.turbo_expires_at);
    console.log('Current JS time (ISO):', new Date().toISOString());

    // Another check: run a query with where clause in JS
    const past = new Date(Date.now() - 3600000).toISOString();
    const future = new Date(Date.now() + 3600000).toISOString();
    
    const { data: testNow } = await supabase.from('anuncios').select('id').gt('turbo_expires_at', past).limit(1);
    console.log('Ads expiring in future (JS Filter > past):', testNow ? testNow.length : 0);
}
check();
