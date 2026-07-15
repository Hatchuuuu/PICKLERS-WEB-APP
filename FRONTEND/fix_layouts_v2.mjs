import fs from 'fs';

function fixLayout(src, dst, layoutName) {
  let content = fs.readFileSync(src, 'utf8');

  // Add use client
  content = '"use client";\n\n' + content;

  // Replace React Router imports
  content = content.replace(/import \{([^}]+)\} from ['"]react-router['"];?/, "import { useRouter, usePathname } from 'next/navigation';");

  // Framer motion
  content = content.replace(/from "framer-motion"/g, 'from "motion/react"');

  // Hooks
  content = content.replace(/const navigate = useNavigate\(\);?/g, 'const router = useRouter();');
  content = content.replace(/const location = useLocation\(\);?/g, 'const pathname = usePathname();');
  content = content.replace(/navigate\(/g, 'router.push(');
  content = content.replace(/location\.pathname/g, 'pathname');

  // Remove Outlet
  content = content.replace(/const outlet = useOutlet\(\);/g, '');
  content = content.replace(/\{outlet\}/g, '{children}');

  if (layoutName === 'AppShellLayout') {
    // Signature
    content = content.replace(/export function AppShellLayout\(\) \{/, 'export function AppShellLayout({ children }: { children?: React.ReactNode }) {');
    // Import ProtectedRoute
    content = content.replace(/import \{ TopUpModal \} from "@\/components\/modals\/TopUpModal";/, 'import { TopUpModal } from "@/components/modals/TopUpModal";\nimport { ProtectedRoute } from "@/components/shared/ProtectedRoute";');
    
    // Wrap return
    const returnRegex = /(return\s*\(\s*)(<div className="flex h-screen overflow-hidden bg-background">)/;
    content = content.replace(returnRegex, '$1<ProtectedRoute>\n    $2');
    
    const endRegex = /(<TopUpModal \/>\s*<\/div>\s*\);\s*\})/;
    content = content.replace(endRegex, '<TopUpModal />\n    </div>\n    </ProtectedRoute>\n  );\n}');
  } else if (layoutName === 'OwnerLayout') {
    // Signature
    content = content.replace(/export function OwnerLayout\(\) \{/, 'export function OwnerLayout({ children }: { children?: React.ReactNode }) {');
    // Import RoleGate and ProtectedRoute
    content = content.replace(/import \{ useAuth \} from "@\/contexts\/AuthContext";/, 'import { useAuth } from "@/contexts/AuthContext";\nimport { ProtectedRoute } from "@/components/shared/ProtectedRoute";\nimport { RoleGate } from "@/components/shared/RoleGate";');
    
    // Wrap return
    const returnRegex = /(return\s*\(\s*)(<div className="flex h-screen overflow-hidden bg-background">)/;
    content = content.replace(returnRegex, '$1<ProtectedRoute>\n    <RoleGate role="owner">\n    $2');
    
    const endRegex = /(<\/AnimatePresence>\s*<\/div>\s*\);\s*\})/;
    content = content.replace(endRegex, '</AnimatePresence>\n    </div>\n    </RoleGate>\n    </ProtectedRoute>\n  );\n}');
  }

  fs.writeFileSync(dst, content, 'utf8');
}

fixLayout('./src/layouts/AppShellLayout.tsx', './src/app/(player)/app/layout.tsx', 'AppShellLayout');
fixLayout('./src/layouts/OwnerLayout.tsx', './src/app/(owner)/app/owner/layout.tsx', 'OwnerLayout');

console.log('Layouts fixed');
