import os
import re
import json

root_dir = "web/src"
supabase_dir = "web/supabase"

findings = []

def add_issue(category, severity, file_path, problem, impact, fix):
    findings.append({
        "Category": category,
        "Severity": severity,
        "File": file_path,
        "Problem": problem,
        "Impact": impact,
        "Fix": fix
    })

# Regex patterns
any_type_pattern = re.compile(r':\s*any\b')
todo_pattern = re.compile(r'//\s*(TODO|FIXME)|/\*\s*(TODO|FIXME)')
console_log_pattern = re.compile(r'console\.log\(')
localstorage_pattern = re.compile(r'localStorage\.')
mockapi_pattern = re.compile(r'MockApi|mockData|LIVE_COURTS')
animate_presence_pattern = re.compile(r'<AnimatePresence([^>]*)>')
framer_motion_pattern = re.compile(r'<motion\.')

for root, _, files in os.walk(root_dir):
    for file in files:
        if not (file.endswith('.ts') or file.endswith('.tsx')):
            continue
        
        path = os.path.join(root, file)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue
            
        # Architecture & Code Quality
        if any_type_pattern.search(content):
            add_issue("Architecture", "🟡 Medium", path, "Usage of `any` type found.", "Reduces TypeScript type safety and can lead to runtime errors.", "Replace `any` with a specific type, interface, or `unknown`.")
            
        if todo_pattern.search(content):
            add_issue("Feature", "🟢 Low", path, "Found TODO/FIXME comment.", "Indicates incomplete feature or technical debt.", "Implement the missing logic and remove the comment.")
            
        if console_log_pattern.search(content):
            add_issue("Architecture", "🟢 Low", path, "Found console.log.", "Clutters the console and might leak sensitive data in production.", "Remove console.log or use a dedicated logging utility.")

        # Flow & Logic
        # Look for missing cleanup in useEffect (naive check)
        if 'useEffect(' in content and 'return () =>' not in content and ('setInterval' in content or 'addEventListener' in content or 'subscribe' in content):
             add_issue("Flow", "🔴 Critical", path, "Possible missing cleanup in useEffect.", "Can cause memory leaks, race conditions, or multiple event listeners.", "Return a cleanup function from useEffect to remove listeners/intervals/subscriptions.")

        # Animation & Motion
        if framer_motion_pattern.search(content):
            # If using AnimatePresence, make sure there's an exit prop in the file somewhere (imperfect but better than nothing)
            if 'AnimatePresence' in content and 'exit=' not in content.replace(' ', ''):
                add_issue("Animation", "🟡 Medium", path, "AnimatePresence used without `exit` animation.", "Components will snap out instantly instead of animating out smoothly.", "Add `exit={{ opacity: 0 }}` or similar to child `motion` components.")

        # Security
        if localstorage_pattern.search(content):
            add_issue("Security", "🟡 Medium", path, "Usage of localStorage found.", "Potential security risk if storing sensitive PII/tokens.", "Verify no sensitive data is stored, or use secure httpOnly cookies for session state.")

        # Backend & Database
        if mockapi_pattern.search(content) and 'mockData.ts' not in file:
             add_issue("Backend", "🔴 Critical", path, "Usage of mock data or MockApi detected in production component.", "Users will see fake data instead of real database entries.", "Wire up the component to Supabase real-time queries or API routes.")
             
        # Brand & Design Consistency (Toast)
        if 'toast.success(' in content or 'toast.error(' in content or 'toast(' in content:
            add_issue("Brand", "🟡 Medium", path, "Review Toast styling.", "Toast styling might not match the brand identity rules defined in AGENTS.md.", "Ensure toasts use the dark pill aesthetic with appropriate emerald/red bg-opacity and borders.")

# Supabase Check
for root, _, files in os.walk(supabase_dir):
    for file in files:
        if not file.endswith('.sql'):
            continue
        path = os.path.join(root, file)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue
        
        # Check for RLS
        if 'CREATE TABLE' in content.upper() and 'ENABLE ROW LEVEL SECURITY' not in content.upper():
            add_issue("Security", "🔴 Critical", path, "Table created without RLS enabled.", "Data is unprotected; any authenticated or anonymous user could potentially read/write all data.", "Add `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;` and create appropriate policies.")

# Save output
with open('full_audit.json', 'w', encoding='utf-8') as f:
    json.dump(findings, f, indent=2)

print(f"Scan complete. Found {len(findings)} potential issues.")
