
const jimp = require('jimp');
const path = require('path');
const fs = require('fs');

async function processAvatar(inputPath, outputName) {
  try {
    console.log(`Processing: ${outputName}...`);
    const original = await jimp.read(inputPath);
    
    // 1. Detect Bounding Box (Ignoring Alpha)
    const cropped = original.clone().autocrop({ leaveBorder: 0, tolerance: 0.05 });
    
    // 2. Canonical 1:1 Frame (256x256)
    const FRAME_SIZE = 256;
    const FILL_FACTOR = 0.85; // 85% occupancy
    const TARGET_CHAR_SIZE = FRAME_SIZE * FILL_FACTOR;

    // Scale to fit TARGET_CHAR_SIZE
    const scaleFactor = Math.min(TARGET_CHAR_SIZE / cropped.bitmap.width, TARGET_CHAR_SIZE / cropped.bitmap.height);
    cropped.scale(scaleFactor);

    // 3. Generate 6 Animated Frames (Scale Protocol: 0.98 -> 1.0 -> 1.02 -> 1.02 -> 1.0 -> 0.98)
    const scales = [0.98, 1.00, 1.02, 1.02, 1.00, 0.98];
    const sprite = new jimp(FRAME_SIZE * 6, FRAME_SIZE, 0x00000000);

    for (let i = 0; i < 6; i++) {
        const frame = new jimp(FRAME_SIZE, FRAME_SIZE, 0x00000000);
        const s = scales[i];
        const scaledChar = cropped.clone().scale(s);
        
        // Center horizontally
        const x = (FRAME_SIZE - scaledChar.bitmap.width) / 2;
        // Center vertically but pull up slightly (8% of frame) to focus on face/bust
        const y = (FRAME_SIZE - scaledChar.bitmap.height) / 2 - (FRAME_SIZE * 0.08);
        
        frame.composite(scaledChar, x, Math.max(2, y));
        sprite.composite(frame, i * FRAME_SIZE, 0);
    }

    // Output path relative to this script (which is in /scripts)
    const outputPath = path.join(__dirname, '..', 'public', 'avatars', outputName);
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

    await sprite.writeAsync(path.join(outputPath, 'sprite.png'));
    
    // Save static version (frame 2)
    const staticFrame = new jimp(FRAME_SIZE, FRAME_SIZE, 0x00000000);
    const xStatic = (FRAME_SIZE - cropped.bitmap.width) / 2;
    const yStatic = (FRAME_SIZE - cropped.bitmap.height) / 2 - (FRAME_SIZE * 0.08);
    staticFrame.composite(cropped, xStatic, Math.max(2, yStatic));
    await staticFrame.writeAsync(path.join(outputPath, 'static.png'));

    console.log(`- Success! /public/avatars/${outputName}/sprite.png`);
    return true;
  } catch (err) {
    console.error(`Error processing ${outputName}:`, err.message);
    return false;
  }
}

async function run() {
    // Path relative to script location
    const srcDir = path.join(__dirname, '..', 'png');
    if (!fs.existsSync(srcDir)) {
        console.error(`Source directory not found: ${srcDir}`);
        return;
    }
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.png'));
    
    console.log(`Found ${files.length} images to process.`);
    
    for (const file of files) {
        // Create an ID from the filename
        const id = file.toLowerCase()
            .replace('gemini_generated_image_', '')
            .replace('-removebg-preview', '')
            .replace(/\(1\)/g, '')
            .replace(/[^a-z0-9_]/g, '')
            .split('_').slice(-1)[0] || 'avatar';
            
        const finalId = id.startsWith('orca_') ? id : `orca_${id}`;
        
        await processAvatar(path.join(srcDir, file), finalId);
    }
}

run();
