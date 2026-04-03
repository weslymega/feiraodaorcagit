const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function verify() {
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
    } catch (e) { console.error('Env error:', e.message); }

    const supabase = createClient(SUPABASE_URL.replace(/['"]/g, ''), SUPABASE_ANON_KEY.replace(/['"]/g, ''));

    // 1. Get a test ad
    const { data: ad, error: fetchError } = await supabase
        .from('anuncios')
        .select('id, titulo, turbo_expires_at')
        .limit(1)
        .single();

    if (fetchError || !ad) {
        console.error('Error fetching test ad:', fetchError);
        return;
    }

    console.log(`🔍 Testing with ad: ${ad.titulo} (${ad.id})`);

    // 2. Set expiration to PAST
    console.log('⏳ Setting expiration to 1 hour ago...');
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    await supabase.from('anuncios').update({ turbo_expires_at: pastDate }).eq('id', ad.id);

    // 3. Check ads_ranked view
    const { data: rankedPast, error: viewError1 } = await supabase
        .from('ads_ranked')
        .select('is_turbo_active')
        .eq('id', ad.id)
        .single();

    if (viewError1) console.error('View error 1:', viewError1);
    console.log(`Result (Past): is_turbo_active = ${rankedPast?.is_turbo_active} (Expected: false)`);

    // 4. Set expiration to FUTURE
    console.log('🚀 Setting expiration to 1 hour from now...');
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    await supabase.from('anuncios').update({ turbo_expires_at: futureDate }).eq('id', ad.id);

    // 5. Check ads_ranked view again
    const { data: rankedFuture, error: viewError2 } = await supabase
        .from('ads_ranked')
        .select('is_turbo_active')
        .eq('id', ad.id)
        .single();

    if (viewError2) console.error('View error 2:', viewError2);
    console.log(`Result (Future): is_turbo_active = ${rankedFuture?.is_turbo_active} (Expected: true)`);

    // Cleanup (optional: set to NULL or original)
    // await supabase.from('anuncios').update({ turbo_expires_at: null }).eq('id', ad.id);
}

verify();
