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
                if (k === 'SUPABASE_SERVICE_ROLE_KEY' || k === 'SERVICE_ROLE_KEY' || k === 'VITE_SUPABASE_SERVICE_ROLE_KEY') SUPABASE_KEY = v;
            }
        });
    } catch (e) { }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: ads, error } = await supabase.from('anuncios').select('id').limit(5);
    console.log('Sample IDs:', ads.map(a => a.id));
}
test();
