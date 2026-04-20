const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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
        if (folder.name === '.emptyFolderPlaceholder' || !folder.id) {
           // If it's not a folder (no id usually implies it's a file or metadata) 
           // but list returning folders should have them.
        }
        
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
