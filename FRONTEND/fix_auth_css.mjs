import fs from 'fs';

let content = fs.readFileSync('src/app/auth/page.tsx', 'utf8');

// Remove all onFocus and onBlur inline style hacks for border color
content = content.replace(/\s*onFocus=\{e => \(e\.currentTarget\.style\.borderColor = "var\(--border-emphasis\)"\)\}/g, '');
content = content.replace(/\s*onBlur=\{e => \(e\.currentTarget\.style\.borderColor =[^}]+\)\}/g, '');

// Change border-accent-danger text-accent-danger to !border-accent-danger text-accent-danger to override the base Tailwind border classes we added
content = content.replace(/"border-accent-danger text-accent-danger"/g, '"!border-accent-danger text-accent-danger"');

fs.writeFileSync('src/app/auth/page.tsx', content);
console.log("Fixed Auth CSS inline issues");
