const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTriggers() {
    const { data, error } = await supabase.rpc('inspect_table_triggers', { table_name: 'profiles' });
    if (error) {
        // Fallback to raw query if RPC doesn't exist
        const { data: data2, error: error2 } = await supabase.from('profiles').select('*').limit(1);
        console.log('Testing connection:', error2 ? 'Fail' : 'Success');
        
        const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', {
            sql_query: `
                SELECT 
                    trigger_name, 
                    event_manipulation, 
                    action_statement, 
                    action_timing 
                FROM information_schema.triggers 
                WHERE event_object_table = 'profiles';
            `
        });
        
        if (triggerError) {
            console.error('Error fetching triggers:', triggerError);
        } else {
            console.log('Triggers on profiles:', triggerData);
        }
    } else {
        console.log('Triggers on profiles:', data);
    }
}

inspectTriggers();
