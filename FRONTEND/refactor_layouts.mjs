import fs from 'fs';

function refactorLayout(sourcePath, destPath, layoutName) {
  let content = fs.readFileSync(sourcePath, 'utf8');

  // Add use client
  content = '"use client";\n\n' + content;

  // React Router replacements
  content = content.replace(/import \{([^}]+)\} from ['"]react-router['"];?/, (match, p1) => {
    return `import { useRouter, usePathname } from 'next/navigation';`;
  });

  // Framer motion replacement
  content = content.replace(/from "framer-motion"/g, 'from "motion/react"');

  // Next.js components
  content = content.replace(/useNavigate\(\)/g, 'useRouter()');
  content = content.replace(/navigate\(/g, 'router.push(');
  content = content.replace(/useLocation\(\)/g, 'usePathname()');
  content = content.replace(/location\.pathname/g, 'pathname');

  // Component signature and Outlet
  if (layoutName === 'AppShellLayout') {
    content = content.replace(/export function AppShellLayout\(\) \{/, 'export function AppShellLayout({ children }: { children?: React.ReactNode }) {');
    content = content.replace(/const outlet = useOutlet\(\);/, '');
    content = content.replace(/\{outlet\}/g, '{children}');
    
    // Add ProtectedRoute imports
    content = content.replace(/import \{ TopUpModal \} from "@\/components\/modals\/TopUpModal";/, 'import { TopUpModal } from "@/components/modals/TopUpModal";\nimport { ProtectedRoute } from "@/components/shared/ProtectedRoute";');
    
    // Wrap with ProtectedRoute
    content = content.replace(/<div className="flex h-screen overflow-hidden bg-background">/, '<ProtectedRoute>\n    <div className="flex h-screen overflow-hidden bg-background">');
    const parts = content.split('</TopUpModal>\n    </div>\n  );\n}');
    if (parts.length === 2) {
      content = parts[0] + '</TopUpModal>\n    </div>\n    </ProtectedRoute>\n  );\n}';
    }
  } else if (layoutName === 'OwnerLayout') {
    content = content.replace(/export function OwnerLayout\(\) \{/, 'export function OwnerLayout({ children }: { children?: React.ReactNode }) {');
    content = content.replace(/const outlet = useOutlet\(\);/, '');
    content = content.replace(/\{outlet\}/g, '{children}');
    
    // Add ProtectedRoute and RoleGate imports
    content = content.replace(/import \{ useAuth \} from "@\/contexts\/AuthContext";/, 'import { useAuth } from "@/contexts/AuthContext";\nimport { ProtectedRoute } from "@/components/shared/ProtectedRoute";\nimport { RoleGate } from "@/components/shared/RoleGate";');
    
    // Wrap with ProtectedRoute and RoleGate
    content = content.replace(/<div className="flex h-screen overflow-hidden bg-background">/, '<ProtectedRoute>\n    <RoleGate role="owner">\n    <div className="flex h-screen overflow-hidden bg-background">');
    
    const parts = content.split('</AnimatePresence>\n    </div>\n  );\n}');
    if (parts.length === 2) {
      content = parts[0] + '</AnimatePresence>\n    </div>\n    </RoleGate>\n    </ProtectedRoute>\n  );\n}';
    }
  }

  fs.writeFileSync(destPath, content, 'utf8');
}

// Ensure directories exist
fs.mkdirSync('./src/app/(player)/app', { recursive: true });
fs.mkdirSync('./src/app/(owner)/app/owner', { recursive: true });

refactorLayout('./src/layouts/AppShellLayout.tsx', './src/app/(player)/app/layout.tsx', 'AppShellLayout');
refactorLayout('./src/layouts/OwnerLayout.tsx', './src/app/(owner)/app/owner/layout.tsx', 'OwnerLayout');

// Cleanup original
fs.unlinkSync('./src/layouts/AppShellLayout.tsx');
fs.unlinkSync('./src/layouts/OwnerLayout.tsx');

console.log('Layouts refactored properly.');
