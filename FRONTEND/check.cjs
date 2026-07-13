const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let allFiles = new Set();
let allFilesLower = new Map();

walkDir('./src', (filePath) => {
    let normalizedPath = filePath.replace(/\\/g, '/');
    allFiles.add(normalizedPath);
    allFilesLower.set(normalizedPath.toLowerCase(), normalizedPath);
});

let errors = [];

walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let importRegex = /from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        let importPath = match[1];
        
        if (importPath.startsWith('.')) {
            let absoluteImportPath = path.join(path.dirname(filePath), importPath).replace(/\\/g, '/');
            let foundExact = false;
            let possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '.css', '/index.ts', '/index.tsx'];
            
            for (let ext of possibleExtensions) {
                if (allFiles.has(absoluteImportPath + ext)) {
                    foundExact = true;
                    break;
                }
            }
            
            if (!foundExact) {
                for (let ext of possibleExtensions) {
                    let testPath = absoluteImportPath + ext;
                    if (allFilesLower.has(testPath.toLowerCase())) {
                        let actualCase = allFilesLower.get(testPath.toLowerCase());
                        errors.push(`File: ${filePath}\nImport: ${importPath}\nActual file on disk: ${actualCase}`);
                        break;
                    }
                }
            }
        }
    }
});

if (errors.length > 0) {
    console.log("CASE SENSITIVITY ERRORS FOUND:");
    console.log(errors.join("\n\n"));
} else {
    console.log("No case sensitivity errors found.");
}
