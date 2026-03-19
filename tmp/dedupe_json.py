
import json

file_path = r"c:\Users\prati\OneDrive\Desktop\AugenBlick\frontend\src\data\historicalConflicts.json"

with open(file_path, 'r', encoding='utf-8') as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        # If it's broken, we need to fix it manually or try to recover
        f.seek(0)
        content = f.read()
        # Basic cleanup for common issues seen
        content = content.replace("]\n```", "]")
        try:
            data = json.loads(content)
        except:
            print("Still failed to decode. Attempting to extract objects...")
            import re
            objs = re.findall(r'\{[^{}]+\}', content)
            data = [json.loads(o) for o in objs]

# Deduplicate based on title, year, date, and coordinates
seen = set()
unique_data = []

for item in data:
    # Create a unique key
    key = (item.get('title'), item.get('year'), item.get('date'), item.get('lat'), item.get('lng'))
    if key not in seen:
        seen.add(key)
        unique_data.append(item)

# Sort by year and date
def sort_key(x):
    year = x.get('year', 0)
    date = x.get('date', "")
    return (year, date)

unique_data.sort(key=sort_key)

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(unique_data, f, indent=2)

print(f"Successfully deduplicated. Total unique items: {len(unique_data)}")
