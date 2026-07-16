import os
import re
import glob

def refactor_catch_blocks(directory):
    pattern_any = re.compile(r'catch\s*\(\s*error\s*:\s*any\s*\)')
    pattern_err = re.compile(r'error\.(message|stack)')

    count = 0
    for root, _, files in os.walk(directory):
        for file in files:
            if not (file.endswith('.ts') or file.endswith('.tsx')):
                continue

            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            if pattern_any.search(content):
                # Replace catch (error: any) with catch (error: unknown)
                content = pattern_any.sub('catch (error: unknown)', content)
                
                # Replace `error.message` with `error instanceof Error ? error.message : "Unknown error"`
                # Very simple regex replacement. A full AST parser is safer, but this covers standard cases.
                content = content.replace('error.message', '(error instanceof Error ? error.message : "Unknown error")')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Refactored: {filepath}")
                count += 1
    
    print(f"Refactored {count} files.")

refactor_catch_blocks('web/src')
