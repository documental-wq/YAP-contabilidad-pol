const fs = require('fs');

try {
  let content = fs.readFileSync('eslint_out_utf8.json', 'utf8');
  if (content.startsWith('\uFEFF')) {
    content = content.slice(1);
  }
  const data = JSON.parse(content);
  console.log(`Total files scanned: ${data.length}`);
  let totalErrors = 0;
  const summary = {};
  
  data.forEach(file => {
    if (file.messages.length > 0) {
      console.log(`\nFile: ${file.filePath}`);
      file.messages.forEach(msg => {
        totalErrors++;
        console.log(`  - Line ${msg.line}: [${msg.ruleId}] ${msg.message}`);
        summary[msg.ruleId] = (summary[msg.ruleId] || 0) + 1;
      });
    }
  });
  
  console.log('\n--- Summary ---');
  console.log(`Total errors: ${totalErrors}`);
  console.log(JSON.stringify(summary, null, 2));
} catch (e) {
  console.error('Error reading JSON:', e.message);
}
