
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // I hope I have this in environment

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const userId = '2b06b852-ec00-4232-b258-689d11dd1085';

async function check() {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profile:', data);
    }
}

check();
