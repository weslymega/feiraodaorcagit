const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectColumns() {
    const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'profiles' });
    if (error) {
        // Fallback to direct query on information_schema if RPC fails
        // Note: This requires a special RPC that executes SQL, which might not exist.
        // But the user has many "check_schema" files, let's see if one works.
        console.log('RPC failed, columns might be different than expected.');
    } else {
        console.log('Columns on profiles:', data.map(c => c.column_name));
    }
}

// Alternatively, just try to select everything and see the keys
async function testSelect() {
   const { data, error } = await supabase.from('profiles').select('*').limit(1);
   if (error) {
       console.log('Select failed:', error.message);
   } else if (data && data[0]) {
       console.log('Available columns in profiles:', Object.keys(data[0]));
   } else {
       console.log('No data in profiles, but select succeeded.');
   }
}

testSelect();
