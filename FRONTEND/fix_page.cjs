const fs = require('fs');
const { execSync } = require('child_process');

let content = execSync('git show HEAD:FRONTEND/src/pages/public/LandingPage.tsx', { cwd: '..' }).toString();

let open = (c) => (c.match(/\(/g) || []).length;
let close = (c) => (c.match(/\)/g) || []).length;
console.log('Original:', open(content), close(content));

content = '"use client";\n\n' + content;
content = content.replace(/import \{ useNavigate \} from 'react-router';/g, 'import { useRouter } from "next/navigation";');
content = content.replace(/import \{ useNavigate \} from "react-router";/g, 'import { useRouter } from "next/navigation";');
console.log('Imports:', open(content), close(content));

content = content.replace(/const navigate = useNavigate\(\);/g, 'const router = useRouter();');
console.log('Hook:', open(content), close(content));

// THE CULPRIT IS HERE: 
content = content.replace(/navigate\(/g, 'router.push(');
console.log('navigate:', open(content), close(content));

content = content.replace(/export function LandingPage\(\) \{/g, 'export default function LandingPage() {');
console.log('export:', open(content), close(content));

content = content.replace(/from "framer-motion"/g, 'from "motion/react"');
console.log('framer:', open(content), close(content));

content = content.replace(/const isDark = resolvedTheme === "dark";/g, 'const isDark = mounted && resolvedTheme === "dark";');
console.log('isDark:', open(content), close(content));

fs.writeFileSync('src/app/page.tsx', content);
