const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(__dirname, 'src');

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (filePath.includes('PicklersLogo.tsx')) {
       return;
    }
    
    let newContent = content;
    
    const patternsToRemove = [
      /,?\s*fontFamily:\s*"'Montserrat', sans-serif",?/g,
      /,?\s*fontFamily:\s*'"Montserrat", sans-serif',?/g,
      /,?\s*fontFamily:\s*"'Outfit', sans-serif",?/g,
      /,?\s*fontFamily:\s*"'DM Mono', monospace",?/g,
      /,?\s*fontFamily:\s*"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",?/g,
      /,?\s*fontFamily:\s*"system-ui, -apple-system, BlinkMacSystemFont, sans-serif",?/g,
      /,?\s*fontFamily:\s*"'Arial Black', Impact, sans-serif",?/g,
    ];

    patternsToRemove.forEach(pattern => {
      newContent = newContent.replace(pattern, '');
    });

    // Clean up
    newContent = newContent.replace(/style=\{\{\s*,\s*/g, 'style={{ ');
    newContent = newContent.replace(/,\s*\}\}/g, ' }}');
    newContent = newContent.replace(/style=\{\{\s*\}\}/g, ''); 
    newContent = newContent.replace(/style=\{\s*\}\}/g, ''); // just in case

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
