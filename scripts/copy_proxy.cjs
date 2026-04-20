
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const dest = process.argv[3];

try {
    const data = fs.readFileSync(src);
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(dest, data);
    console.log(`Copied ${src} to ${dest}`);
} catch (e) {
    console.error(`Failed to copy: ${e.message}`);
}
