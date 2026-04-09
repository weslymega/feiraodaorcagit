const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xkkjjvrucnlilegwnoey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra2pqdnJ1Y25saWxlZ3dub2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzI0MTUsImV4cCI6MjA4MzcwODQxNX0._zW2u3e8xzNethI1fv70oLTOSeOB7z5tFo77zfS4RZQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
    if (error) {
        // If RPC doesn't exist, we try a different way
        const { data: data2, error: error2 } = await supabase.from('profiles').select().limit(0); 
        // This won't give columns unless it works
        console.log('Error or no RPC:', error.message);
    } else {
        console.log(data);
    }
}
checkSchema();
