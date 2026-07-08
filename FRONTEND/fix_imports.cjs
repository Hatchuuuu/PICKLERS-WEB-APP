const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  const exportRegex = /export\s+(?:function|const|let|var|type|interface|class)\s+([A-Za-z0-9_]+)/g;
  let match;
  const exportedNames = [];
  while ((match = exportRegex.exec(code)) !== null) {
    exportedNames.push(match[1]);
  }
  // Special case: PlayerSettingsTab might be exported but imported as PlayerSettingsTab
  if (code.includes('export function PlayerSettingsTab')) {
    exportedNames.push('PlayerSettingsTab');
  }

  const lines = code.split('\n');
  let newLines = [];
  
  for (let line of lines) {
    let isImportLine = line.startsWith('import ') || 
                       (line.includes(',') && !line.includes('(') && !line.includes('=') && !line.includes(':'));
    
    // We only care about the import block at the very top.
    if (line.startsWith('import ') && line.includes('from')) {
       let skip = false;
       for (let name of exportedNames) {
         // If it's a single import line for this exported name
         const singleRegex = new RegExp(`^import\\s+\\{\\s*${name}\\s*\\}\\s+from\\s+['"].*?['"];?$`);
         if (singleRegex.test(line.trim())) {
            skip = true;
            changed = true;
            break;
         }
         
         // If it's a multiple import line, replace it
         if (line.includes(` ${name} `) || line.includes(` ${name},`) || line.includes(`{ ${name} }`) || line.includes(`, ${name} `)) {
            line = line.replace(new RegExp(`\\b${name}\\b\\s*,?\\s*`), '');
            line = line.replace(/\{\s*,/, '{').replace(/,\s*,/g, ',').replace(/,\s*\}/, '}');
            changed = true;
         }
       }
       if (!skip) {
         if (!line.match(/^import\s+\{\s*\}\s+from/)) {
            newLines.push(line);
         }
       }
    } else {
       newLines.push(line);
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, newLines.join('\n'));
  }
});

console.log("Imports fixed.");
