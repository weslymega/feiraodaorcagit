const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkPushTokens() {
    console.log("🕵️‍♂️ Checking 'push_tokens' table...");

    const { data, error } = await supabase
        .from('push_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("❌ Error fetching push_tokens:", error.message);
        return;
    }

    if (data.length === 0) {
        console.log("⚠️ No tokens found.");
        return;
    }

    console.log(`\n📊 LATEST 20 TOKENS (out of ${data.length} found):`);
    data.forEach(t => {
        console.log(`- User: ${t.user_id.substring(0,8)}... | Token: ${t.token.substring(0,20)}... | Platform: ${t.platform} | Created: ${t.created_at}`);
    });

    // Check for duplicates (same user, multiple tokens)
    const userTokens = {};
    data.forEach(t => {
        userTokens[t.user_id] = (userTokens[t.user_id] || 0) + 1;
    });

    console.log("\n🔄 TOKENS PER USER (Sample):");
    Object.entries(userTokens).forEach(([uid, count]) => {
        if (count > 1) console.log(`- User ${uid.substring(0,8)} has ${count} tokens in this sample.`);
    });
}

checkPushTokens();
