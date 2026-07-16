import os, re
files = [
    'web/src/components/shared/modals/DeleteAccountModal.tsx',
    'web/src/components/shared/modals/EditFieldModal.tsx',
    'web/src/components/shared/modals/EmailUpdateModal.tsx',
    'web/src/components/shared/modals/LogoutConfirmModal.tsx',
    'web/src/components/shared/modals/PhoneSetupModal.tsx'
]
for rf in files:
    with open(rf, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = re.sub(r'import React from [\'\"]react[\'\"];?\s*\n', '', content, count=1)
    if new_content != content:
        with open(rf, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Fixed {rf}')
