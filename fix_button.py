import os

path = 'web/src/components/ui/button.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add motion import
if 'import { motion }' not in content:
    content = content.replace("import * as React from 'react';", "import * as React from 'react';\nimport { motion } from 'motion/react';")

# 2. Remove active:scale-[0.97] from buttonVariants
content = content.replace("active:scale-[0.97] ", "")

# 3. Change Component to use motion and add whileTap
if '<Comp' in content:
    # Find the function Button
    old_comp = "const Comp = asChild ? SlotPrimitive : 'button';"
    new_comp = "const BaseComp = asChild ? SlotPrimitive : 'button';\n  const Comp = motion.create(BaseComp as any);"
    content = content.replace(old_comp, new_comp)
    
    # Add whileTap
    content = content.replace("<Comp\n      data-slot=\"button\"", "<Comp\n      data-slot=\"button\"\n      whileTap={{ scale: 0.96 }}\n      transition={{ type: 'spring', stiffness: 400, damping: 25 }}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated button.tsx")
