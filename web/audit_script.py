import os
import re
import json

src_dir = r"C:\Users\Nitro\Desktop\PICKLERS WEB APP\web\src"
findings = []

def add_finding(severity, category, files, problem, impact, fix):
    findings.append({
        "Severity": severity,
        "Category": category,
        "File(s)": files,
        "Problem": problem,
        "Impact": impact,
        "Fix": fix
    })

# Read all files
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
                rel_path = os.path.relpath(filepath, src_dir).replace('\\', '/')
                
                # Check console.log
                if "console.log" in content:
                    add_finding("🟢 Low", "Architecture", rel_path, "Contains console.log statements", "Clutters production console and may leak minor info.", "Remove or replace with a proper logger.")
                
                # Check TODO / FIXME
                if "TODO:" in content or "FIXME:" in content or "TODO " in content or "FIXME " in content:
                    add_finding("🟡 Medium", "Feature", rel_path, "Contains TODO or FIXME comments", "Incomplete features or known technical debt.", "Resolve the pending tasks and remove the comments.")

                # Check Framer Motion
                if "AnimatePresence" in content and "motion." in content and "exit=" not in content.replace(" ", ""):
                    add_finding("🟡 Medium", "Animation", rel_path, "AnimatePresence used without exit props", "Exit animations will not play, causing abrupt DOM removal.", "Add exit={{ opacity: 0 }} (or similar) to motion components inside AnimatePresence.")
                
                # Check Brand / Toast colors (simple heuristic)
                if "bg-green" in content or "bg-blue" in content or "bg-red" in content:
                    if "toast(" in content and "bg-emerald-500/10" not in content and "bg-red-500/10" not in content:
                        add_finding("🟡 Medium", "Brand", rel_path, "Incorrect toast styling", "Breaks brand consistency guidelines.", "Update to use bg-emerald-500/10 or bg-red-500/10 with backdrop-blur.")

with open("audit_results.json", "w", encoding="utf-8") as f:
    json.dump(findings, f, indent=2)

print("Done")
