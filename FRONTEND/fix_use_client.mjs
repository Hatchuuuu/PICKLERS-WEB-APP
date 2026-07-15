import fs from 'fs';

const files = [
  'src/contexts/AuthContext.tsx',
  'src/contexts/AppContext.tsx',
  'src/app/auth/page.tsx',
  'src/components/shared/FacilityDetailView.tsx',
  'src/app/(player)/app/facility/[id]/page.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.startsWith('"use client"')) {
      fs.writeFileSync(f, '"use client";\n\n' + content, 'utf8');
      console.log('Added use client to', f);
    }
  }
});
