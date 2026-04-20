import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xkkjjvrucnlilegwnoey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra2pqdnJ1Y25saWxlZ3dub2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzI0MTUsImV4cCI6MjA4MzcwODQxNX0._zW2u3e8xzNethI1fv70oLTOSeOB7z5tFo77zfS4RZQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testColumn() {
    console.log('Testing visibility of avatar_id column via Anon Key...');
    const { data, error } = await supabase
        .from('profiles')
        .select('avatar_id')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting avatar_id:', error.code, error.message);
        if (error.code === 'PGRST204') {
            console.log('Diagnosis: PGRST204 confirmed. Column is missing from schema cache.');
        }
    } else {
        console.log('✅ Success! Column avatar_id is visible in schema cache.');
        console.log('Data sample:', data);
    }
}

testColumn();
