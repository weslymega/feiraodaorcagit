
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function diagnose() {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

    if (!urlMatch || !keyMatch) {
        console.error("Missing SUPABASE info in .env");
        return;
    }

    const supabaseUrl = urlMatch[1].trim();
    const serviceRoleKey = keyMatch[1].trim();

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("--- Diagnosing table: ad_turbo_sessions ---");
    const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'ad_turbo_sessions')
        .eq('table_schema', 'public');

    if (colError) {
        console.error("❌ Error fetching columns:", colError.message);

        // Fallback: try to select one row
        console.log("--- Fallback: select * ---");
        const { data, error } = await supabase.from('ad_turbo_sessions').select('*').limit(1);
        if (error) {
            console.error("❌ Select * failed:", error.message);
        } else {
            console.log("✅ Select * keys:", data && data[0] ? Object.keys(data[0]) : "No data");
        }
    } else {
        console.log("✅ Columns found:");
        columns.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
    }
}

diagnose();
