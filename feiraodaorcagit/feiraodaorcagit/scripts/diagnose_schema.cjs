const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('--- Investigating Profiles Schema ---');
    
    // Check Columns
    const { data: cols, error: colError } = await supabase.rpc('exec_sql', {
        sql_query: `
            SELECT column_name, udt_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles'
            ORDER BY ordinal_position;
        `
    });

    if (colError) {
        console.error('Error fetching columns:', colError.message);
        // Fallback: try picking it directly
        const { data: testData, error: testError } = await supabase.from('profiles').select('avatar_id').limit(1);
        if (testError) {
            console.log('Direct select of avatar_id FAILED:', testError.message);
        } else {
            console.log('Direct select of avatar_id SUCCESSFUL but cache might be weird.');
        }
    } else {
        console.log('Columns in profiles:');
        console.table(cols);
        const hasAvatarId = cols.some(c => c.column_name === 'avatar_id');
        console.log(`\nDoes avatar_id exist? ${hasAvatarId ? '✅ YES' : '❌ NO'}`);
    }

    // Check RLS Policies
    const { data: policies, error: polError } = await supabase.rpc('exec_sql', {
        sql_query: `
            SELECT tablename, policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'profiles';
        `
    });

    if (polError) {
        console.error('Error fetching policies:', polError.message);
    } else {
        console.log('\nRLS Policies on profiles:');
        console.table(policies);
    }
}

checkSchema();
