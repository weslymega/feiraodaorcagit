
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const adId = process.argv[2];

async function check() {
    const { data: session, error } = await supabase
        .from('ad_turbo_sessions')
        .select('*')
        .eq('ad_id', adId);
    
    if (error) {
        console.error('Error fetching sessions:', error);
        return;
    }

    console.log('Sessions for adId:', adId);
    console.log(JSON.stringify(session, null, 2));

    const { data: activeSessions } = await supabase
        .from('ad_turbo_sessions')
        .select('*')
        .eq('ad_id', adId)
        .eq('status', 'active');
    
    console.log('Active sessions:', JSON.stringify(activeSessions, null, 2));
}

check();
