import fs from 'fs';
import path from 'path';

const moves = [
  { src: './src/pages/owner/CourtCard.tsx', dst: './src/components/owner/CourtCard.tsx' },
  { src: './src/pages/owner/OwnerBracket.tsx', dst: './src/components/owner/OwnerBracket.tsx' },
  { src: './src/pages/player/FacilityDetailView.tsx', dst: './src/components/shared/FacilityDetailView.tsx' }
];

moves.forEach(({ src, dst }) => {
  if (fs.existsSync(src)) {
    // 1. Move file
    const content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dst, content, 'utf8');
    fs.unlinkSync(src);

    // 2. Refactor its react-router usage just like we did for everything else
    let updated = '"use client";\n\n' + content;
    updated = updated.replace(/import \{([^}]+)\} from ['"]react-router['"];?/g, (match, p1) => {
      let imports = p1.split(',').map(s => s.trim());
      let nextImports = [];
      if (imports.includes('useNavigate')) nextImports.push('useRouter');
      if (imports.includes('useLocation')) nextImports.push('usePathname');
      if (imports.includes('useParams')) nextImports.push('useParams');
      if (imports.includes('useSearchParams')) nextImports.push('useSearchParams');
      return nextImports.length > 0 ? `import { ${Array.from(new Set(nextImports)).join(', ')} } from 'next/navigation';\n` : '';
    });
    updated = updated.replace(/const navigate = useNavigate\(\);?/g, 'const router = useRouter();');
    updated = updated.replace(/navigate\(/g, 'router.push(');
    updated = updated.replace(/const location = useLocation\(\);?/g, 'const pathname = usePathname();');
    updated = updated.replace(/location\.pathname/g, 'pathname');
    updated = updated.replace(/from "framer-motion"/g, 'from "motion/react"');
    
    fs.writeFileSync(dst, updated, 'utf8');
    console.log(`Moved and refactored ${src} -> ${dst}`);
  }
});

// Update imports across the whole project
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

  const replaceMap = {
    '@/pages/owner/CourtCard': '@/components/owner/CourtCard',
    '@/pages/owner/OwnerBracket': '@/components/owner/OwnerBracket',
    '@/pages/player/FacilityDetailView': '@/components/shared/FacilityDetailView'
  };

  for (const [oldImport, newImport] of Object.entries(replaceMap)) {
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport, 'g'), newImport);
      changed = true;
    }
  }

  // Also fix the other minor TS errors:
  // "Property 'env' does not exist on type 'ImportMeta'" -> replace import.meta.env.VITE_ with process.env.NEXT_PUBLIC_
  if (content.includes('import.meta.env.VITE_')) {
    content = content.replace(/import\.meta\.env\.VITE_/g, 'process.env.NEXT_PUBLIC_');
    changed = true;
  }
  
  if (content.includes('import.meta.env.')) {
    content = content.replace(/import\.meta\.env\./g, 'process.env.');
    changed = true;
  }
  
  // Fix searchParams in auth/page.tsx:
  if (file.includes('auth') && content.includes('searchParams.entries()')) {
    // Next.js searchParams in client is from `useSearchParams()` and has `.get()` instead of array destructuring sometimes, or we just fix the specific type error.
    // Error: Property 'get' does not exist on type '[string, string]'.
    // In React Router: `for (const [key, value] of searchParams.entries())`
    // Wait, the error is `src/app/auth/page.tsx(17,31): error TS2339: Property 'get' does not exist on type '[string, string]'.`
    // Let's replace the whole search params logic with standard URLSearchParams usage.
    content = content.replace(/searchParams\.entries\(\)/g, 'Array.from(searchParams.entries())');
    changed = true;
  }
  
  if (file.includes('auth') && content.includes('<Navigate ')) {
     content = content.replace(/<Navigate to=\{([^}]+)\} replace \/>/g, '{/* Nav handled by router.push */ router.push($1)}');
     changed = true;
  }

  // Fix owner-application and facility/[id] params type mismatch (number vs string)
  // `id === 1` should be `id === "1"` since Next.js useParams returns string | string[].
  // Or `parseInt(id as string) === 1`.
  if (file.includes('owner-application') || file.includes('facility')) {
    if (content.includes('id === 1')) {
      content = content.replace(/id === 1/g, 'id === "1"');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed TS errors in ${file}`);
  }
});
