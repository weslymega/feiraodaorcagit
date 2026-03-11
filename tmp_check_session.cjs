require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkSession() {
    const sessionId = 'f3b5b223-d14c-4e85-b4a1-af674e9b9fae';
    const { data, error } = await supabase
        .from('ad_turbo_sessions')
        .select('*')
        .eq('id', sessionId);

    if (error) {
        console.error('Error fetching session:', error);
        return;
    }

    console.log('Session Data:', JSON.stringify(data, null, 2));
}

checkSession();
