
const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      return null;
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } catch (e) {
    return null;
  }
}

const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
const folders = fs.readdirSync(avatarsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log('--- Avatar Asset Audit ---');
folders.forEach(id => {
  const spritePath = path.join(avatarsDir, id, 'sprite.png');
  const dims = getPngDimensions(spritePath);
  if (dims) {
    const ratio = dims.width / dims.height;
    console.log(`${id}: ${dims.width}x${dims.height} (Ratio: ${ratio.toFixed(2)}) - ${Math.round(ratio) === 6 ? '✅ OK' : '❌ WRONG RATIO'}`);
  } else {
    // console.log(`${id}: sprite.png NOT FOUND or INVALID`);
  }
});
