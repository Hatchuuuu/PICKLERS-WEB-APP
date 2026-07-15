import fs from 'fs';
import walk from 'path';
function walkDir(dir) {
  let res = [];
  fs.readdirSync(dir).forEach(f => {
    let p = walk.join(dir, f);
    if (fs.statSync(p).isDirectory()) res = res.concat(walkDir(p));
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) res.push(p);
  });
  return res;
}
walkDir('./src').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  if (c.includes('router.push(-1)')) {
    c = c.replace(/router\.push\(-1\)/g, 'router.back()');
    changed = true;
  }
  if (f.includes('auth\\\\page.tsx') || f.includes('auth/page.tsx')) {
    c = c.replace(/router\.push\(([^,]+),\s*\{ replace: true \}\)/g, 'router.replace($1)');
    c = c.replace(/navigate/g, 'router');
    changed = true;
  }
  if (c.includes('id === 1')) {
    c = c.replace(/id === 1/g, 'id === "1"');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(f, c);
    console.log("Fixed", f);
  }
});
