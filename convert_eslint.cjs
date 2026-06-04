const fs = require('fs');

try {
  const content = fs.readFileSync('c:/Users/gdocumental/Pictures/Screenshots/YAP/YAP-APP-DON-FRANCISCO-main/eslint_out.json', 'utf16le');
  fs.writeFileSync('c:/Users/gdocumental/Pictures/Screenshots/YAP/YAP-APP-DON-FRANCISCO-main/eslint_out_utf8.json', content, 'utf8');
  console.log('Conversion successful!');
} catch (e) {
  console.error('Conversion failed:', e.message);
}
