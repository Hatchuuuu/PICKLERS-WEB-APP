import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add "use client" if it's a page or component and doesn't have it
  if (file.includes('src\\app\\') || file.includes('src/app/') || file.includes('components')) {
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
      content = '"use client";\n\n' + content;
      changed = true;
    }
  }

  // Next.js Navigation hook imports
  if (content.includes('react-router')) {
    content = content.replace(/import \{([^}]+)\} from ['"]react-router['"];?/g, (match, p1) => {
      let imports = p1.split(',').map(s => s.trim());
      let nextImports = [];
      let reactRouterImports = [];
      
      if (imports.includes('useNavigate')) {
        nextImports.push('useRouter');
      }
      if (imports.includes('useLocation')) {
        nextImports.push('usePathname');
      }
      if (imports.includes('useParams')) {
        nextImports.push('useParams');
      }
      if (imports.includes('useSearchParams')) {
        nextImports.push('useSearchParams');
      }
      
      let importString = '';
      if (nextImports.length > 0) {
        importString += `import { ${Array.from(new Set(nextImports)).join(', ')} } from 'next/navigation';\n`;
      }
      
      return importString;
    });

    // Replace usages
    content = content.replace(/const navigate = useNavigate\(\);?/g, 'const router = useRouter();');
    content = content.replace(/navigate\(/g, 'router.push(');
    content = content.replace(/const location = useLocation\(\);?/g, 'const pathname = usePathname();');
    content = content.replace(/location\.pathname/g, 'pathname');
    content = content.replace(/useOutlet\(\)/g, 'null'); // Handled by children
    
    changed = true;
  }
  
  // Fix Layouts (AppShellLayout and OwnerLayout)
  if (file.includes('AppShellLayout.tsx') || file.includes('OwnerLayout.tsx')) {
    content = content.replace(/export function (\w+)\(\) \{/, 'export function $1({ children }: { children?: React.ReactNode }) {');
    content = content.replace(/\{outlet\}/g, '{children}');
    content = content.replace(/const outlet = null;/g, ''); // cleanup useOutlet replacement
    changed = true;
  }

  // Fix Pages that were importing react-router Navigate
  if (content.includes('<Navigate ')) {
    // Next.js redirect doesn't work inside render like <Navigate>.
    // But since it's a client component, we can use useEffect or we replace it with a Client-side redirect component.
    // For simplicity, we just use Next's standard hook approach or Next.js `redirect` in an effect.
    content = content.replace(/<Navigate to=\{([^}]+)\} replace \/>/g, '{/* Next.js Navigate handled by router.push */ router.push($1)}');
    changed = true;
  }
  
  // Framer motion import fix
  if (content.includes('from "framer-motion"')) {
    content = content.replace(/from "framer-motion"/g, 'from "motion/react"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log('Refactoring complete.');
