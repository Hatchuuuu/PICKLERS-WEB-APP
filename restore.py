import json

with open('c:/Users/Nitro/.gemini/antigravity-ide/brain/878827f5-c91e-4db6-98e4-c4c864def662/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'TOOL_RESPONSE' and 'owner-application/page.tsx' in str(data.get('content', '')):
            content = data.get('content', '')
            if 'The following changes were made' in content:
                start = content.find('[diff_block_start]')
                end = content.find('[diff_block_end]')
                if start != -1 and end != -1:
                    diff_text = content[start:end]
                    original_lines = []
                    for dl in diff_text.split('\n'):
                        if dl.startswith('@@') or dl == '[diff_block_start]':
                            continue
                        if dl.startswith('-'):
                            original_lines.append(dl[1:])
                        elif dl.startswith(' '):
                            original_lines.append(dl[1:])
                    # Found the big diff
                    if len(original_lines) > 100:
                        with open('web/src/app/(player)/app/owner-application/page.tsx', 'w', encoding='utf-8') as out:
                            out.write('\n'.join(original_lines))
                        print('Restored successfully')
                        break
