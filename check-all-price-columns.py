#\!/usr/bin/env python3
import json
import urllib.request

print("=== Checking ALL Price-Related Columns ===")
print()

# Get service key
service_key = None
try:
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                service_key = line.split('=', 1)[1].strip()
                break
except:
    print("❌ Could not read .env file")
    exit(1)

supabase_url = "https://eucfoommxxvqmmwdbkdv.supabase.co/rest/v1/crypto_calls"

# Get a sample record to see all columns
query_url = f"{supabase_url}?select=*&limit=1"
req = urllib.request.Request(query_url)
req.add_header('apikey', service_key)
req.add_header('Authorization', f'Bearer {service_key}')

try:
    response = urllib.request.urlopen(req)
    records = json.loads(response.read().decode())
    
    if records:
        record = records[0]
        
        # Find all price-related columns
        price_columns = []
        current_columns = []
        
        for key in sorted(record.keys()):
            if 'price' in key.lower():
                price_columns.append(key)
            if 'current' in key.lower():
                current_columns.append(key)
        
        print("Price-related columns:")
        for col in price_columns:
            value = record.get(col)
            print(f"  - {col}: {value} (type: {type(value).__name__})")
        
        print("\nCurrent-related columns:")
        for col in current_columns:
            value = record.get(col)
            print(f"  - {col}: {value} (type: {type(value).__name__})")
        
        # Check specific duplicates
        print("\nPotential duplicates:")
        if 'price_current' in record and 'current_price' in record:
            print(f"  ⚠️  Both 'price_current' and 'current_price' exist\!")
            print(f"     price_current: {record.get('price_current')}")
            print(f"     current_price: {record.get('current_price')}")
            
except Exception as e:
    print(f"Error: {e}")

# Count non-null values for each column
print("\n\nChecking usage of price columns...")

for col in ['price_at_call', 'price_current', 'current_price']:
    count_url = f"{supabase_url}?select=count&{col}=not.is.null"
    req = urllib.request.Request(count_url)
    req.add_header('apikey', service_key)
    req.add_header('Authorization', f'Bearer {service_key}')
    req.add_header('Prefer', 'count=exact')
    
    try:
        response = urllib.request.urlopen(req)
        count = int(response.headers.get('content-range', '0-0/0').split('/')[-1])
        print(f"{col}: {count} records have data")
    except:
        print(f"{col}: Could not get count (column might not exist)")

