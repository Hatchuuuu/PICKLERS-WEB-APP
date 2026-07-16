import re

def remove_unused(filepath, removals):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in removals:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Remove React
react_files = [
    'web/src/components/shared/FacilitySetupWizard.tsx',
    'web/src/components/shared/modals/DeleteAccountModal.tsx',
    'web/src/components/shared/modals/EditFieldModal.tsx',
    'web/src/components/shared/modals/EmailUpdateModal.tsx',
    'web/src/components/shared/modals/LogoutConfirmModal.tsx',
    'web/src/components/shared/modals/PhoneSetupModal.tsx'
]
for rf in react_files:
    remove_unused(rf, [
        ("import React, { useState }", "import { useState }"),
        ("import React from 'react';\n", "")
    ])

# TopUpModal fixes
remove_unused('web/src/components/modals/TopUpModal.tsx', [
    ("const { isTopUpModalOpen, setTopUpModalOpen, addBalance } = useWalletStore();", "const { isTopUpModalOpen, setTopUpModalOpen } = useWalletStore();"),
    ("const { createCheckoutSession, isLoading, isShaking, error } = usePaymongo();", "const { createCheckoutSession, isLoading } = usePaymongo();"),
    ("const [status, setStatus] = useState<\"idle\" | \"processing\" | \"success\">(\"idle\");", "const [status] = useState<\"idle\" | \"processing\" | \"success\">(\"idle\");")
])

# WalletPill fixes
remove_unused('web/src/components/shared/WalletPill.tsx', [
    ("const { balance, setTopUpModalOpen, fetchBalance, isLoadingBalance } = useWalletStore();", "const { balance, setTopUpModalOpen, fetchBalance } = useWalletStore();")
])

print("Fixed unused imports")
