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
    } catch (e) { console.error('Env error:', e.message); }

    const supabase = createClient(SUPABASE_URL.replace(/['"]/g, ''), SUPABASE_ANON_KEY.replace(/['"]/g, ''));
    const { data, error } = await supabase.from('anuncios').select('*').limit(1).single();
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(Object.keys(data)));
}
check();
