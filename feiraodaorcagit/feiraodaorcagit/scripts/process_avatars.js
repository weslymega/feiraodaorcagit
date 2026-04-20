import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';

const TARGET_DIR = 'public/avatars';
const FRAME_SIZE = 256;
const SPRITE_WIDTH = 1536; // 6 * 256
const SPRITE_HEIGHT = 256;

async function processAvatar(avatarName, rawImagePath, options = {}) {
    console.log(`Processing ${avatarName}...`);
    const { cols = 6, rows = 1, removeBg = true, maxFrames = 6 } = options;
    
    try {
        const image = await Jimp.read(rawImagePath);
        const imgWidth = image.getWidth();
        const imgHeight = image.getHeight();
        
        const cellWidth = Math.floor(imgWidth / cols);
        const cellHeight = Math.floor(imgHeight / rows);

        // Prepare directory
        const dir = path.join(TARGET_DIR, avatarName);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // New sprite sheet (1x6)
        const newSprite = new Jimp(FRAME_SIZE * maxFrames, FRAME_SIZE, 0x00000000);

        for (let i = 0; i < maxFrames; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            if (row >= rows) break;

            const frame = image.clone().crop(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            
            // Resize to 256x256
            frame.resize(FRAME_SIZE, FRAME_SIZE);

            // Remove Background (Transparent logic)
            if (removeBg) {
                // Heurística: se a cor for muito próxima do branco, torna-se transparente
                frame.scan(0, 0, frame.bitmap.width, frame.bitmap.height, function(x, y, idx) {
                    const r = this.bitmap.data[idx + 0];
                    const g = this.bitmap.data[idx + 1];
                    const b = this.bitmap.data[idx + 2];
                    
                    if (r > 240 && g > 240 && b > 240) {
                        this.bitmap.data[idx + 3] = 0;
                    }
                });
            }

            // Paste into new sprite
            newSprite.composite(frame, i * FRAME_SIZE, 0);

            // Save first frame as static
            if (i === 0) {
                const staticPath = path.join(dir, 'static.png');
                await frame.writeAsync(staticPath);
                console.log(`Saved static: ${staticPath}`);
            }
        }

        // Save sprite.png
        const spritePath = path.join(dir, 'sprite.png');
        await newSprite.writeAsync(spritePath);
        console.log(`Saved sprite: ${spritePath}`);

        return true;
    } catch (err) {
        console.error(`Error processing ${avatarName}:`, err);
        return false;
    }
}

// CLI Handling
const args = process.argv.slice(2);
if (args.length >= 2) {
    const avatarName = args[0];
    const rawPath = args[1];
    const c = parseInt(args[2]) || 6;
    const r = parseInt(args[3]) || 1;
    processAvatar(avatarName, rawPath, { cols: c, rows: r });
} else {
    console.log("Usage: node process_avatars.js <name> <path> [cols] [rows]");
}
