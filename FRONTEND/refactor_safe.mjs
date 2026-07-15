import fs from 'fs';

const files = [
  'src/app/auth/page.tsx',
  'src/components/shared/FacilityDetailView.tsx',
  'src/app/(player)/app/facility/[id]/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // React Router -> Next Router
  content = content.replace(/import \{([^}]+)\} from ['"]react-router['"];?/g, (match, p1) => {
    let imports = p1.split(',').map(s => s.trim());
    let nextImports = [];
    if (imports.includes('useNavigate')) nextImports.push('useRouter');
    if (imports.includes('useLocation')) nextImports.push('usePathname');
    if (imports.includes('useParams')) nextImports.push('useParams');
    if (imports.includes('useSearchParams')) nextImports.push('useSearchParams');
    return nextImports.length > 0 ? `import { ${Array.from(new Set(nextImports)).join(', ')} } from 'next/navigation';\n` : '';
  });

  // Framer motion
  content = content.replace(/from "framer-motion"/g, 'from "motion/react"');

  // Hook usages
  content = content.replace(/const navigate = useNavigate\(\);?/g, 'const router = useRouter();');
  content = content.replace(/const location = useLocation\(\);?/g, 'const pathname = usePathname();');
  
  // Auth searchparams
  content = content.replace(/const \[searchParams\] = useSearchParams\(\);/g, 'const searchParams = useSearchParams();');
  content = content.replace(/router\.push\(redirect \|\| \(intent === "owner" \? "\/app\/owner" : "\/app"\), \{ replace: true \}\);/g, 'router.replace(redirect || (intent === "owner" ? "/app/owner" : "/app"));');
  content = content.replace(/navigate,/g, 'router,');

  // facility route push
  content = content.replace(/router\.push\(-1\)/g, 'router.back()');
  // type casting for ID in facility detail view
  content = content.replace(/f\.id === id/g, 'String(f.id) === String(id)');
  content = content.replace(/f\.id === Number\(id\)/g, 'String(f.id) === String(id)');
  content = content.replace(/f => f\.id === id as string/g, 'f => String(f.id) === String(id)');

  // Rename components if necessary (AuthPage to AuthPage etc already fine)
  fs.writeFileSync(f, content, 'utf8');
});

console.log("Refactored safely");
