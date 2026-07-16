import os

filepath = r'c:\Users\Nitro\Desktop\PICKLERS WEB APP\web\src\app\(player)\app\settings\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update identity extraction
old_identities = '''  const hasGoogle = identities.some(id => id.provider === 'google');
  const hasFacebook = identities.some(id => id.provider === 'facebook');'''

new_identities = '''  const googleIdentity = identities.find(id => id.provider === 'google');
  const facebookIdentity = identities.find(id => id.provider === 'facebook');
  const hasGoogle = !!googleIdentity;
  const hasFacebook = !!facebookIdentity;
  const googleDisplay = googleIdentity?.identity_data?.email || googleIdentity?.identity_data?.name || googleIdentity?.identity_data?.full_name || undefined;
  const facebookDisplay = facebookIdentity?.identity_data?.name || facebookIdentity?.identity_data?.full_name || facebookIdentity?.identity_data?.email || undefined;'''

content = content.replace(old_identities, new_identities)

# 2. Add value to Google row
old_google_label = 'label="Google"'
new_google_label = 'label="Google" value={googleDisplay}'
# Only replace the one in SettingsRow
content = content.replace(old_google_label, new_google_label, 1)

# 3. Add value to Facebook row
old_facebook_label = 'label="Facebook" hasBorder={false}'
new_facebook_label = 'label="Facebook" value={facebookDisplay} hasBorder={false}'
content = content.replace(old_facebook_label, new_facebook_label, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Identities display logic added successfully.")
    