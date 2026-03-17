const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkBuckets() {
    console.log('--- checking buckets ---');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    const required = ['ads-images', 'chat-images'];
    required.forEach(req => {
        const found = buckets.find(b => b.name === req);
        if (found) {
            console.log(`✅ Bucket "${req}" exists.`);
        } else {
            console.log(`❌ Bucket "${req}" NOT FOUND.`);
        }
    });
}

checkBuckets();
