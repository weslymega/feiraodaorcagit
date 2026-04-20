
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'public', 'avatars');

const mapping = {
    'orca_png': 'orca_family',
    'orca_luxurypng': 'orca_millionaire',
    'orca_hunterpng': 'orca_detective',
    'orca_investorpng': 'orca_investor',
    'orca_spacepng': 'orca_astronaut',
    'orca_premiumpng': 'orca_premium',
    'orca_sportpng': 'orca_sport',
    'orca_0png': 'orca_seller'
};

Object.entries(mapping).forEach(([oldName, newName]) => {
    const oldPath = path.join(base, oldName);
    const newPath = path.join(base, newName);
    
    if (fs.existsSync(oldPath)) {
        // If the new path already exists, we might need to overwrite or just remove the old one
        // For now, let's just move if it doesn't exist
        if (!fs.existsSync(newPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed ${oldName} to ${newName}`);
        } else {
            // Merge or replace? Let's just move the sprite.png into the existing one
            fs.copyFileSync(path.join(oldPath, 'sprite.png'), path.join(newPath, 'sprite.png'));
            fs.copyFileSync(path.join(oldPath, 'static.png'), path.join(newPath, 'static.png'));
            console.log(`Updated ${newName} with fixed assets.`);
            // Clean up old
            fs.rmSync(oldPath, { recursive: true, force: true });
        }
    }
});
