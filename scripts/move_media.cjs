const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\machine3\\.gemini\\antigravity\\brain\\05649c6b-85f3-4338-8ffc-4cabe4251aae';
const targetDir = path.join(process.cwd(), 'public', 'avatars');

const mapping = {
    'media__1776624720084.png': 'orca_detective_raw.png',
    'media__1776624720215.png': 'orca_sweet_raw.png',
    'media__1776624720346.png': 'orca_explorer_raw.png',
    'media__1776624720556.png': 'orca_millionaire_raw.png',
    'media__1776624720838.png': 'orca_astronaut_raw.png',
    'media__1776624910417.png': 'orca_mafia_raw.png'
};

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

for (const [src, dest] of Object.entries(mapping)) {
    const srcPath = path.join(sourceDir, src);
    const destPath = path.join(targetDir, dest);
    try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${src} to ${dest}`);
    } catch (e) {
        console.error(`Failed to copy ${src}:`, e.message);
    }
}
