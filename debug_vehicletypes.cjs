const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAds() {
  const { data, error } = await supabase.from('ads').select('id, title, category, details').eq('category', 'veiculos');
  if (error) {
    console.error('Error fetching ads:', error);
    return;
  }

  console.log(`Found ${data.length} vehicle ads.`);
  data.forEach(ad => {
    console.log(`ID: ${ad.id} | Title: ${ad.title} | Details vehicleType: ${ad.details?.vehicleType}`);
  });
}

checkAds();
