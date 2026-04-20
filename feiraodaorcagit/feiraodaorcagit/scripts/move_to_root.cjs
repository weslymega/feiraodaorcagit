const fs = require('fs');
const path = require('path');

const sourceDir = 'c:\\Users\\machine3\\feiraodaorcagit\\feiraodaorcagit\\public\\avatars';
const targetDir = 'c:\\Users\\machine3\\feiraodaorcagit\\public\\avatars';

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const files = fs.readdirSync(sourceDir);
for (const file of files) {
    if (file.endsWith('.png')) {
        try {
            fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
            console.log(`Moved ${file} to root`);
        } catch (e) {
            console.error(`Failed to move ${file}: ${e.message}`);
        }
    }
}
