import os

with open('recovered.txt', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('[diff_block_start]')
end = content.find('[diff_block_end]')
diff_text = content[start:end]

original_lines = []
for dl in diff_text.split('\n'):
    if dl.startswith('-') and not dl.startswith('---'):
        original_lines.append(dl[1:])
    elif dl.startswith(' ') and not dl.startswith(' +'):
        original_lines.append(dl[1:])

with open('web/src/app/(player)/app/bookings/page.tsx', 'w', encoding='utf-8') as out:
    out.write('"use client";\n\nimport { useState } from "react";\nimport { motion, AnimatePresence } from "motion/react";\nimport { CalendarDays, Wallet, AlertTriangle, Navigation } from "lucide-react";\nimport { cn, statusColor } from "@/lib/utils";\nimport { useApp } from "@/contexts/AppContext";\nimport { useToast } from "@/contexts/ToastContext";\nimport { NavigationOverlay } from "@/components/shared/NavigationOverlay";\n')
    out.write('\n'.join(original_lines))
    out.write('\n    </div>\n  );\n}\n')

print("Recovered!")
