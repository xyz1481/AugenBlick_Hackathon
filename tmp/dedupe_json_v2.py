
import json

file_path = r"c:\Users\prati\OneDrive\Desktop\AugenBlick\frontend\src\data\historicalConflicts.json"

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Deduplicate based on coordinates and date (most reliable for "same event")
seen = {}
unique_data = []

for item in data:
    # Key: (rounded lat, rounded lng, date)
    # Using small rounding to handle tiny coordinate variations if any
    key = (round(item.get('lat', 0), 2), round(item.get('lng', 0), 2), item.get('date'))
    
    if key not in seen:
        seen[key] = item
        unique_data.append(item)
    else:
        # If we see it again, keep the one with the longer news or title if it was better
        existing = seen[key]
        if len(item.get('news', '')) > len(existing.get('news', '')):
            seen[key] = item
            # Update in the list
            idx = unique_data.index(existing)
            unique_data[idx] = item

# Sort by year and date
def sort_key(x):
    year = x.get('year', 0)
    date = x.get('date', "")
    return (year, date)

unique_data.sort(key=sort_key)

with open(file_path, 'w', encoding='utf-8') as f:
    # Use ensure_ascii=False to keep em-dashes as characters
    json.dump(unique_data, f, indent=2, ensure_ascii=False)

print(f"Aggressively deduplicated. Total unique items: {len(unique_data)}")
