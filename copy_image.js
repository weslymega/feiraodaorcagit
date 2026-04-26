const fs = require('fs');
const src = 'C:\\Users\\machine3\\.gemini\\antigravity\\brain\\33dc2273-0215-4b76-b189-069667656bf3\\play_store_icon_1777074944122.png';
const dest = 'c:\\Users\\machine3\\feiraodaorcagit\\play_store_icon_fixed.png';
try {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied to ' + dest);
} catch (err) {
  console.log('Error copying:', err.message);
}

