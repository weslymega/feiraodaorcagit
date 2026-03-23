const fs = require('fs');
const src = 'C:\\Users\\machine3\\.gemini\\antigravity\\brain\\e101d56a-b851-4393-a550-6ba9526027ce\\about_orca_illustration_1774232116619.png';
const dest = 'c:\\Users\\machine3\\feiraodaorcagit\\public\\assets\\about_illustration.png';
try {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied');
} catch (err) {
  console.log('Error copying:', err.message);
}
