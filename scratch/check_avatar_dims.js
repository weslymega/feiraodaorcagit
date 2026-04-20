const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

const avatarsDir = 'c:/Users/machine3/feiraodaorcagit/public/avatars';
const avatars = fs.readdirSync(avatarsDir).filter(f => fs.statSync(path.join(avatarsDir, f)).isDirectory());

avatars.forEach(avatar => {
  const spritePath = path.join(avatarsDir, avatar, 'sprite.png');
  if (fs.existsSync(spritePath)) {
    try {
      const dimensions = sizeOf(spritePath);
      console.log(`${avatar}: ${dimensions.width}x${dimensions.height}`);
    } catch (e) {
      console.log(`${avatar}: Error reading dimensions`);
    }
  } else {
    console.log(`${avatar}: No sprite.png`);
  }
});
