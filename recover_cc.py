import json

target = 'web/src/components/owner/CourtCard.tsx'
transcript_path = r'C:\Users\Nitro\.gemini\antigravity-ide\brain\c79b2b7d-033f-4c14-b579-d48a63c1611e\.system_generated\logs\transcript_full.jsonl'

found_diff = False
original_lines = []

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = str(data.get('content', ''))
            
            if data.get('type') == 'TOOL_RESPONSE' and target in content and '@@ -88,23 +88,6 @@' in content:
                print('Found the botched edit tool response!')
                start = content.find('[diff_block_start]')
                end = content.find('[diff_block_end]')
                diff_text = content[start:end]
                
                with open('recovered_cc.txt', 'w', encoding='utf-8') as out:
                    out.write(diff_text)
                found_diff = True
        except Exception as e:
            continue

if found_diff:
    print('Diff extracted')
else:
    print('Not found')
