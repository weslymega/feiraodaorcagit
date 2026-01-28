const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env
let SUPABASE_URL, SUPABASE_ANON_KEY;

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.trim();
        }
    });
} catch (e) { }

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEdgeFunction() {
    console.log("🚀 Testing 'create_ad' Edge Function...");

    const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const adData = {
        title: "Test Ad " + new Date().getTime(),
        description: "Testing images",
        price: 100,
        category: "autos",
        location: "Test Location",
        images: [dummyImage],
        imagens: [dummyImage] // Sending both to be sure
    };

    const { data, error } = await supabase.functions.invoke('create_ad', {
        body: adData
    });

    if (error) {
        console.error("❌ Edge Function Error:", error);
        return;
    }

    console.log("✅ Ad created via Edge Function. ID:", data.id);
    console.log("Imagens saved in DB result:", data.imagens);

    if (data.imagens && data.imagens.length > 0) {
        console.log("🎉 SUCCESS: Images were saved correctly.");
    } else {
        console.log("❌ FAILURE: Images array is still empty.");
    }
}

testEdgeFunction();
