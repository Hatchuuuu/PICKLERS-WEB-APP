import json
import os

target = 'web/src/app/(player)/app/bookings/page.tsx'
transcript_path = r'C:\Users\Nitro\.gemini\antigravity-ide\brain\c79b2b7d-033f-4c14-b579-d48a63c1611e\.system_generated\logs\transcript_full.jsonl'

found_diff = False
original_lines = []

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = str(data.get('content', ''))
            
            if data.get('type') == 'TOOL_RESPONSE' and target in content and '@@ -4,230 +4,9 @@' in content:
                print('Found the botched edit tool response!')
                start = content.find('[diff_block_start]')
                end = content.find('[diff_block_end]')
                diff_text = content[start:end]
                
                for dl in diff_text.split('\n'):
                    if dl.startswith('-') and not dl.startswith('---'):
                        original_lines.append(dl[1:])
                
                found_diff = True
        except Exception as e:
            continue

if found_diff:
    print(f'Recovered {len(original_lines)} deleted lines.')
    with open('web/src/app/(player)/app/bookings/page.tsx', 'w', encoding='utf-8') as out:
        out.write('"use client";\n\nimport { useState } from "react";\nimport { motion, AnimatePresence } from "motion/react";\nimport { CalendarDays, Wallet, AlertTriangle, Navigation } from "lucide-react";\nimport { cn, statusColor } from "@/lib/utils";\nimport { useApp } from "@/contexts/AppContext";\nimport { useToast } from "@/contexts/ToastContext";\nimport { NavigationOverlay } from "@/components/shared/NavigationOverlay";\n')
        out.write('\n'.join(original_lines))
        out.write('\n    </div>\n  );\n}\n')
    print('File restored successfully!')
else:
    print('Diff not found in transcript.')
