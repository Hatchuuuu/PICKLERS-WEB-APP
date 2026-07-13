const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Modals overlays
  content = content.replace(/bg-\[#0B132B\]\/80 backdrop-blur-3xl/g, 'bg-black/20 dark:bg-[#0B132B]/80 backdrop-blur-3xl');
  content = content.replace(/bg-surface-base\/80 dark:bg-\[#0A1118\]\/80/g, 'bg-black/20 dark:bg-[#0A1118]/80');
  content = content.replace(/bg-\[#0B132B\]\/80 backdrop-blur-md/g, 'bg-black/20 dark:bg-[#0B132B]/80 backdrop-blur-md');

  // Modal borders and gradients
  content = content.replace(/bg-gradient-to-b from-\[#1A2235\] to-\[#0B132B\]/g, 'bg-background dark:bg-gradient-to-b dark:from-[#1A2235] dark:to-[#0B132B]');
  content = content.replace(/bg-\[#0B132B\]\/95/g, 'bg-background dark:bg-[#0B132B]/95');
  
  // Specific shadow and border for the modal wrapper
  content = content.replace(/shadow-\[0_30px_80px_rgba\(0,0,0,0\.6\),0_0_0_1px_rgba\(255,255,255,0\.05\)\]/g, 'shadow-xl dark:shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] ring-1 ring-black/5 dark:ring-0');
  
  // Inner modal background
  content = content.replace(/bg-\[#0A1124\]/g, 'bg-surface-base dark:bg-[#0A1124]');

  // Cancel buttons in modals
  content = content.replace(/text-slate-300 bg-white\/\[0\.03\] border border-white\/\[0\.08\] hover:bg-white\/\[0\.06\] hover:text-white/g, 'text-foreground/80 dark:text-slate-300 bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white');

  // Typography in modals
  content = content.replace(/<h3 className="text-\[19px\] font-bold text-white tracking-tight mb-2">/g, '<h3 className="text-[19px] font-bold text-foreground dark:text-white tracking-tight mb-2">');
  content = content.replace(/<p className="text-\[14px\] text-slate-400 font-medium leading-relaxed px-1">/g, '<p className="text-[14px] text-muted-foreground dark:text-slate-400 font-medium leading-relaxed px-1">');
  content = content.replace(/<p className="text-\[14px\] text-slate-400 font-medium leading-relaxed mb-6">/g, '<p className="text-[14px] text-muted-foreground dark:text-slate-400 font-medium leading-relaxed mb-6">');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./src');
