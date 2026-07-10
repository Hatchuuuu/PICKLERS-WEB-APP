const fs = require('fs');
const files = [
  'src/pages/public/LandingPage.tsx',
  'src/pages/public/AuthPage.tsx',
  'src/layouts/OwnerLayout.tsx',
  'src/layouts/AppShellLayout.tsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/className="text-3xl font-black tracking-tighter" style=\{\{\s*color:\s*"var\(--ink-primary\)"\s*\}\}>PICKLERS/g, 
                'className="text-3xl font-black tracking-tighter" style={{ fontFamily: "\'Montserrat\', sans-serif", color: "var(--ink-primary)" }}>PICKLERS');
  c = c.replace(/className="text-xl font-black tracking-tighter" style=\{\{\s*color:\s*"var\(--ink-primary\)"\s*\}\}>PICKLERS/g, 
                'className="text-xl font-black tracking-tighter" style={{ fontFamily: "\'Montserrat\', sans-serif", color: "var(--ink-primary)" }}>PICKLERS');
  c = c.replace(/style=\{\{\s*letterSpacing/g, 'style={{ fontFamily: "\'Arial Black\', Impact, sans-serif", letterSpacing');
  fs.writeFileSync(f, c);
  console.log("Restored in", f);
});
