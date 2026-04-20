import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRAME_SIZE = 256;
const MAX_FRAMES = 6;
const TARGET_DIR = path.resolve(__dirname, '../public/avatars');

/**
 * SENIOR AVATAR PROCESSOR
 * 
 * Objectives:
 * 1. Strictly 1x6 Horizontal Sprite Sheet (1536x256)
 * 2. Perfect 256x256 frames with no "bleeding" (frame containment)
 * 3. Consistent "Bust" framing for all characters
 */
async function processAvatar(avatarName, rawImagePath, cols = 6, rows = 1) {
    console.log(`\n🚀 Senior Processing: ${avatarName}`);
    
    try {
        const image = await Jimp.read(rawImagePath);
        const imgWidth = image.getWidth();
        const imgHeight = image.getHeight();
        
        const cellWidth = Math.floor(imgWidth / cols);
        const cellHeight = Math.floor(imgHeight / rows);

        console.log(`- Source: ${imgWidth}x${imgHeight} (${cols}x${rows})`);
        
        const dir = path.join(TARGET_DIR, avatarName);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Final Sprite Canvas (1536x256)
        const finalSprite = new Jimp(FRAME_SIZE * MAX_FRAMES, FRAME_SIZE, 0x00000000);
        
        let firstFrameProcessed = null;

        for (let i = 0; i < MAX_FRAMES; i++) {
            const gridCol = i % cols;
            const gridRow = Math.floor(i / cols);
            
            if (gridRow >= rows) break;

            // 1. Extract Isolated Frame (Aggressive Margin)
            // Margem de 15px é segura para esses sprites pois o personagem ocupa o centro.
            const margin = 15;
            const sourceX = Math.round(gridCol * (imgWidth / cols)) + margin;
            const sourceY = Math.round(gridRow * (imgHeight / rows)) + margin;
            const w = Math.round(imgWidth / cols) - (margin * 2);
            const h = Math.round(imgHeight / rows) - (margin * 2);

            if (w <= 0 || h <= 0) {
                console.warn(`! Warning: Frame ${i} too small after margin. Skipping.`);
                continue;
            }

            const frame = image.clone().crop(sourceX, sourceY, w, h);
            
            // 2. ENQUADRAMENTO SÊNIOR (Isolamento Total)
            // Autocrop remove as transparências das bordas.
            frame.autocrop();

            const aspect = w / h;
            if (aspect < 0.8) {
                // Se for muito alto (corpo inteiro), focamos no busto
                // Mas o autocrop já ajudou a isolar.
            }

            // Centraliza e escala para preencher o máximo possível do 256x256 mantendo proporção
            frame.contain(FRAME_SIZE, FRAME_SIZE, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);

            // 3. Composite into final sheet
            finalSprite.composite(frame, i * FRAME_SIZE, 0);

            if (i === 0) firstFrameProcessed = frame.clone();
        }

        // Save Files
        await finalSprite.writeAsync(path.join(dir, 'sprite.png'));
        if (firstFrameProcessed) {
            await firstFrameProcessed.writeAsync(path.join(dir, 'static.png'));
        }

        console.log(`✅ Success: ${avatarName} (1536x256)`);
        return true;
    } catch (err) {
        console.error(`❌ Error ${avatarName}:`, err.message);
        return false;
    }
}

async function runAll() {
    const library = [
        { id: 'orca_buyer', src: '../public/avatars/orca_buyer.png', c: 6, r: 1 },
        { id: 'orca_seller', src: '../public/avatars/orca_seller.png', c: 6, r: 1 },
        { id: 'orca_detective', src: '../public/avatars/orca_detective_raw.png', c: 6, r: 1 },
        { id: 'orca_sweet', src: '../public/avatars/orca_sweet_raw.png', c: 6, r: 1 },
        { id: 'orca_explorer', src: '../public/avatars/orca_explorer_raw.png', c: 6, r: 1 },
        { id: 'orca_millionaire', src: '../public/avatars/orca_millionaire_raw.png', c: 4, r: 2 },
        { id: 'orca_astronaut', src: '../public/avatars/orca_astronaut_raw.png', c: 4, r: 2 },
        { id: 'orca_mafia', src: '../public/avatars/orca_mafia_raw.png', c: 4, r: 2 }
    ];

    for (const item of library) {
        const fullPath = path.join(__dirname, item.src);
        if (fs.existsSync(fullPath)) {
            await processAvatar(item.id, fullPath, item.c, item.r);
        } else {
            console.warn(`! Missing source for ${item.id}: ${fullPath}`);
        }
    }
}

const args = process.argv.slice(2);
if (args.length >= 2) {
    processAvatar(args[0], path.resolve(process.cwd(), args[1]), parseInt(args[2]) || 6, parseInt(args[3]) || 1);
} else {
    runAll();
}
