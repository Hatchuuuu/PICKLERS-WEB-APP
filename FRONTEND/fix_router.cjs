const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add useNavigate and useLocation and Outlet imports if needed
  if (!code.includes('import { Outlet, useNavigate, useLocation }')) {
    code = `import { Outlet, useNavigate, useLocation, Link } from "react-router";\n` + code;
    changed = true;
  }

  // Layouts
  if (file.includes('AppShellLayout.tsx')) {
    code = code.replace(
      /export function AppShellLayout\(\s*\{ view, onNavigate \}:\s*\{\s*view:\s*View;\s*onNavigate:\s*\(v:\s*View\)\s*=>\s*void\s*\}\s*\)/g,
      'export function AppShellLayout()'
    );
    code = code.replace(
      /export function PlayerShell/g,
      'export function AppShellLayout'
    );
    if (!code.includes('const navigate = useNavigate();')) {
      code = code.replace(
        /export function AppShellLayout\(\) \{/,
        'export function AppShellLayout() {\n  const navigate = useNavigate();\n  const location = useLocation();\n  const view = "player-" + (location.pathname.split("/").pop() === "app" ? "play" : location.pathname.split("/").pop());'
      );
    }
    // Replace onNavigate calls
    code = code.replace(/onNavigate\("owner-dashboard"\)/g, 'navigate("/app/owner")');
    code = code.replace(/onNavigate\("landing"\)/g, 'navigate("/")');
    code = code.replace(/onNavigate\(tab\.id\)/g, 'navigate(`/app/${tab.id.replace("player-", "") === "play" ? "" : tab.id.replace("player-", "")}`)');
    // Replace outlet
    code = code.replace(/<AnimatePresence mode="wait">[\s\S]+?<\/AnimatePresence>/, '<AnimatePresence mode="wait"><Outlet /></AnimatePresence>');
    changed = true;
  }

  if (file.includes('OwnerLayout.tsx')) {
    code = code.replace(
      /export function OwnerLayout\(\s*\{ view, onNavigate \}:\s*\{\s*view:\s*View;\s*onNavigate:\s*\(v:\s*View\)\s*=>\s*void\s*\}\s*\)/g,
      'export function OwnerLayout()'
    );
    code = code.replace(
      /export function OwnerShell/g,
      'export function OwnerLayout'
    );
    if (!code.includes('const navigate = useNavigate();')) {
      code = code.replace(
        /export function OwnerLayout\(\) \{/,
        'export function OwnerLayout() {\n  const navigate = useNavigate();\n  const location = useLocation();\n  const view = "owner-" + (location.pathname.split("/").pop() === "owner" ? "dashboard" : location.pathname.split("/").pop());'
      );
    }
    code = code.replace(/onNavigate\("player-play"\)/g, 'navigate("/app")');
    code = code.replace(/onNavigate\("landing"\)/g, 'navigate("/")');
    code = code.replace(/onNavigate\(tab\.id\)/g, 'navigate(`/app/owner/${tab.id.replace("owner-", "") === "dashboard" ? "" : tab.id.replace("owner-", "")}`)');
    code = code.replace(/<AnimatePresence mode="wait">[\s\S]+?<\/AnimatePresence>/, '<AnimatePresence mode="wait"><Outlet /></AnimatePresence>');
    changed = true;
  }

  // Replace onNavigate in Pages
  if (file.includes('LandingPage.tsx') || file.includes('AuthPage.tsx') || file.includes('PlayerSettings.tsx')) {
    code = code.replace(/\{ onNavigate \}:\s*\{\s*onNavigate:\s*\(v:\s*View\)\s*=>\s*void\s*\}/g, '()');
    if (!code.includes('const navigate = useNavigate();')) {
      code = code.replace(/export function ([A-Za-z]+)\(\)\s*\{/, 'export function $1() {\n  const navigate = useNavigate();');
    }
    code = code.replace(/onNavigate\("auth"\)/g, 'navigate("/auth")');
    code = code.replace(/onNavigate\("landing"\)/g, 'navigate("/")');
    code = code.replace(/onNavigate\("player-play"\)/g, 'navigate("/app")');
    code = code.replace(/onNavigate\("owner-dashboard"\)/g, 'navigate("/app/owner")');
    changed = true;
  }

  // Remove `type View` references and `View` usages across the board if we can, or just let TS ignore it.
  code = code.replace(/as View/g, 'as any');

  if (changed) {
    fs.writeFileSync(file, code);
  }
});

console.log("Router fix applied.");
