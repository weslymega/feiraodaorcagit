const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../../.env' }); // Adjusted to reach the root .env

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function inspectAvatars() {
    console.log('--- Inspecting "avatars" bucket ---');
    console.log('URL:', process.env.VITE_SUPABASE_URL);
    
    // List folders in the bucket
    const { data: folders, error: foldersError } = await supabase.storage.from('avatars').list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
    });

    if (foldersError) {
        console.error('Error listing folders:', foldersError);
        return;
    }

    console.log('Folders found:', folders.map(f => f.name));

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        
        console.log(`\nChecking path: ${folder.name}`);
        const { data: contents, error: contentsError } = await supabase.storage.from('avatars').list(folder.name);
        
        if (contentsError) {
            console.error(`Error listing contents in ${folder.name}:`, contentsError);
            continue;
        }
        
        console.log(`Contents in ${folder.name}:`, contents.map(f => f.name));
    }
}

inspectAvatars();
