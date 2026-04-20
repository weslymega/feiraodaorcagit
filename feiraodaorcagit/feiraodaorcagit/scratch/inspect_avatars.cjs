const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../../.env' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function inspectAvatars() {
    console.log('--- Inspecting "avatars" bucket ---');
    
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
        
        console.log(`\nChecking folder: ${folder.name}`);
        const { data: files, error: filesError } = await supabase.storage.from('avatars').list(folder.name);
        
        if (filesError) {
            console.error(`Error listing files in ${folder.name}:`, filesError);
            continue;
        }
        
        console.log(`Files in ${folder.name}:`, files.map(f => f.name));
    }
}

inspectAvatars();
