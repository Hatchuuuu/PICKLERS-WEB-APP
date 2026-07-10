const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const colorMap = {
  '#00d4ff': 'var(--accent-primary)',
  '#080f2e': 'var(--surface-base)',
  '#0f1d47': 'var(--surface-raised)',
  '#1a2d6e': 'var(--surface-interactive)',
  '#22c55e': 'var(--accent-success)',
  '#ef4444': 'var(--accent-danger)',
  '#f59e0b': 'var(--accent-warning)',
  '#a0b4e0': 'var(--ink-secondary)',
  '#6b82b8': 'var(--ink-muted)',
  '#e8eeff': 'var(--ink-primary)',
  '#131f52': 'var(--surface-interactive)',
  '#0b1640': 'var(--surface-base)',
  'rgba(0,212,255,0.12)': 'var(--border-subtle)',
  'rgba(0,212,255,0.15)': 'var(--border-default)',
  'rgba(0,212,255,0.08)': 'var(--border-subtle)',
  'rgba(26,45,110,0.6)': 'var(--surface-interactive)',
  'rgba(26,45,110,0.4)': 'var(--surface-interactive)',
  'rgba(0,212,255,0.1)': 'var(--accent-primary-muted)',
  'rgba(34,197,94,0.3)': 'rgba(52,211,153,0.3)',
  'rgba(34,197,94,0.15)': 'rgba(52,211,153,0.15)',
  'rgba(0,212,255,0.2)': 'var(--border-emphasis)',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      for (const [oldColor, newColor] of Object.entries(colorMap)) {
        // Simple string replacement (case-insensitive for hex)
        const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (regex.test(content)) {
          content = content.replace(regex, newColor);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Color replacement complete.');
