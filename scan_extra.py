import os

issues = []
for r, d, f in os.walk('web/src'):
    for file in f:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(r, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f2:
                content = f2.read()
            no_space_content = content.replace(' ', '')
            
            # Dead code / Empty clicks
            if 'onClick={()=>{}}' in no_space_content or 'onClick={(e)=>{}}' in no_space_content:
                issues.append(f'Empty onClick in {path}')
            
            # Dead links
            if 'href=\"#\"' in no_space_content or "href='#'" in no_space_content:
                issues.append(f'Dead link in {path}')
                
            # Missing AnimatePresence exits
            if 'AnimatePresence' in content and 'exit=' not in no_space_content:
                issues.append(f'Missing exit animation on AnimatePresence child in {path}')
                
            # console.log
            if 'console.log' in content:
                issues.append(f'console.log in {path}')

            # Empty States checks (heuristics)
            # if mapping over array, check if there's a length check or empty state
            if '.length===0' not in no_space_content and '.length>0' not in no_space_content and '.map(' in no_space_content:
                # This is weak, but we can log it
                pass

for i in set(issues):
    print(i)
