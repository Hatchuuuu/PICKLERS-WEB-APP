import fs from 'fs';

// 1. ProtectedRoute
let pr = fs.readFileSync('src/components/shared/ProtectedRoute.tsx', 'utf8');
if (!pr.includes('ProtectedRouteInner')) {
  pr = pr.replace(/export function ProtectedRoute\(\{ children \}: \{ children: React\.ReactNode \}\) \{/g, 'function ProtectedRouteInner({ children }: { children: React.ReactNode }) {');
  pr += '\n\nexport function ProtectedRoute(props: { children: React.ReactNode }) {\n  return <React.Suspense fallback={<div className="bg-background h-screen w-full" />}><ProtectedRouteInner {...props} /></React.Suspense>;\n}';
  pr = 'import React from "react";\n' + pr;
  fs.writeFileSync('src/components/shared/ProtectedRoute.tsx', pr);
  console.log('Fixed ProtectedRoute');
}

// 2. AuthPage
let ap = fs.readFileSync('src/app/auth/page.tsx', 'utf8');
if (!ap.includes('AuthPageInner')) {
  ap = ap.replace(/export default function AuthPage\(\) \{/g, 'function AuthPageInner() {');
  ap += '\n\nexport default function AuthPage() {\n  return <React.Suspense fallback={<div className="bg-background h-screen w-full" />}><AuthPageInner /></React.Suspense>;\n}';
  fs.writeFileSync('src/app/auth/page.tsx', ap);
  console.log('Fixed AuthPage');
}
