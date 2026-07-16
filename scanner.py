import os
import re
import json

root_dir = "web/src"

results = {
    "Architecture": [],
    "Flow": [],
    "UI": [],
    "Animation": [],
    "Security": [],
    "Backend": [],
    "Feature": []
}

def add_issue(category, severity, file_path, problem, impact, fix):
    results[category].append({
        "Severity": severity,
        "File": file_path,
        "Problem": problem,
        "Impact": impact,
        "Fix": fix
    })

for root, _, files in os.walk(root_dir):
    for file in files:
        if not (file.endswith('.ts') or file.endswith('.tsx')):
            continue
        
        path = os.path.join(root, file)
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        # 1. Architecture: 'any' types
        if re.search(r'\bany\b', content):
            # Try to distinguish actual `any` types vs random words
            if re.search(r':\s*any\b', content):
                add_issue("Architecture", "🟡 Medium", path, "Usage of `any` type found.", "Reduces TypeScript type safety and can lead to runtime errors.", "Replace `any` with a specific type, interface, or `unknown`.")
        
        # 1. Architecture: Unused imports/vars
        # Very rough heuristic: if we see 'TODO' or 'FIXME'
        if 'TODO' in content or 'FIXME' in content:
            add_issue("Feature", "🟡 Medium", path, "Found TODO/FIXME comment.", "Indicates incomplete feature or technical debt.", "Implement the missing logic and remove the comment.")
            
        # 2. UI/UX: Empty states missing?
        # Difficult to check statically, but we can check for Suspense/loading
        
        # 3. Animation: AnimatePresence without exit
        if 'AnimatePresence' in content and 'exit=' not in content.replace(' ', ''):
             add_issue("Animation", "🟡 Medium", path, "AnimatePresence used without `exit` animation.", "Components will snap out instantly instead of animating out smoothly.", "Add `exit={{ opacity: 0 }}` or similar to child `motion` components.")
             
        # 4. Security: LocalStorage
        if 'localStorage' in content and not 'token' in content.lower():
            add_issue("Security", "🟡 Medium", path, "Usage of localStorage found.", "Potential security risk if storing sensitive PII/tokens.", "Verify no sensitive data is stored, or use secure httpOnly cookies for session state.")

        # 5. Backend: MockApi
        if 'MockApi' in content or 'LIVE_COURTS' in content or 'mockData' in content:
             # Exclude the mockData file itself
             if 'mockData.ts' not in file:
                 add_issue("Backend", "🔴 Critical", path, "Usage of mock data or MockApi detected in production component.", "Users will see fake data instead of real database entries.", "Wire up the component to Supabase real-time queries or API routes.")

with open('audit_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
print("Audit script complete.")
