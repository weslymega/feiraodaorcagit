
const jimp = require('jimp');
const path = require('path');
const fs = require('fs');

async function processAvatar(inputPath, outputName) {
  try {
    console.log(`Processing: ${path.basename(inputPath)}...`);
    const original = await jimp.read(inputPath);
    
    // 1. Detect Bounding Box (Ignoring Alpha)
    // autocrop is useful but we want control
    const cropped = original.clone().autocrop({ leaveBorder: 0, tolerance: 0.02 });
    const { width: cW, height: cH } = cropped.bitmap;
    
    console.log(`- Detected character size: ${cW}x${cH}`);

    // 2. Head/Bust Priority Logic
    // We want to zoom in if cH is too tall (full body)
    // For bust, we usually want the top 60% of a full body character to be the focus
    // if cH > cW * 1.5, it's likely full body.
    let focusWidth = cW;
    let focusHeight = cH;
    let cropX = 0;
    let cropY = 0;

    if (cH > cW * 1.2) {
      console.log("- Full body detected, cropping to bust...");
      focusHeight = cW * 1.1; // Make it more square-ish bust
      // crop from top (offset a bit to not cut head)
    }

    const bustImg = cropped.clone().crop(0, 0, cW, Math.min(cH, focusHeight));
    
    // 3. Create canonical 1:1 Frame (256x256)
    const FRAME_SIZE = 256;
    const FILL_FACTOR = 0.88; // 88% occupancy
    const TARGET_CHAR_SIZE = FRAME_SIZE * FILL_FACTOR;

    // Resize bustImg to fit TARGET_CHAR_SIZE
    const scaleFactor = Math.min(TARGET_CHAR_SIZE / bustImg.bitmap.width, TARGET_CHAR_SIZE / bustImg.bitmap.height);
    bustImg.scale(scaleFactor);

    // 4. Generate 6 Animated Frames (Scale Protocol)
    const scales = [0.98, 1.00, 1.02, 1.02, 1.00, 0.98];
    const sprite = new jimp(FRAME_SIZE * 6, FRAME_SIZE, 0x00000000);

    for (let i = 0; i < 6; i++) {
        const frame = new jimp(FRAME_SIZE, FRAME_SIZE, 0x00000000);
        const s = scales[i];
        
        const scaledChar = bustImg.clone().scale(s);
        
        // Center horizontally
        const x = (FRAME_SIZE - scaledChar.bitmap.width) / 2;
        // Center vertically but pull eyes slightly up (offset by 10% of frame)
        const y = (FRAME_SIZE - scaledChar.bitmap.height) / 2 - (FRAME_SIZE * 0.08);
        
        frame.composite(scaledChar, x, Math.max(5, y)); // 5px top safety margin
        
        sprite.composite(frame, i * FRAME_SIZE, 0);
    }

    const outputPath = path.join(process.cwd(), 'public', 'avatars', outputName);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    await sprite.writeAsync(path.join(outputDir, 'sprite.png'));
    
    // Save a static version too (frame 2 is 1.00 scale)
    const staticFrame = new jimp(FRAME_SIZE, FRAME_SIZE, 0x00000000);
    const x = (FRAME_SIZE - bustImg.bitmap.width) / 2;
    const y = (FRAME_SIZE - bustImg.bitmap.height) / 2 - (FRAME_SIZE * 0.08);
    staticFrame.composite(bustImg, x, Math.max(5, y));
    await staticFrame.writeAsync(path.join(outputDir, 'static.png'));

    console.log(`- Success! Sprite saved to /public/avatars/${outputName}/sprite.png`);
    return true;
  } catch (err) {
    console.error(`Error processing ${inputPath}:`, err);
    return false;
  }
}

// CLI usage: node scripts/process_avatar.cjs <inputPath> <outputName>
const [,, input, output] = process.argv;
if (input && output) {
    processAvatar(input, output);
} else {
    console.log("Usage: node scripts/process_avatar.cjs <inputPath> <outputName>");
}
