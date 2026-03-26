
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xkkjjvrucnlilegwnoey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra2pqdnJ1Y25saWxlZ3dub2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzI0MTUsImV4cCI6MjA4MzcwODQxNX0._zW2u3e8xzNethI1fv70oLTOSeOB7z5tFo77zfS4RZQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkColumns() {
    console.log('--- Checking profiles table columns ---');
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error fetching profiles:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('Available columns:', Object.keys(data[0]));
        } else {
            console.log('No data found in profiles table to check columns.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkColumns();
