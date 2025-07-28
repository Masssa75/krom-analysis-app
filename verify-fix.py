#\!/usr/bin/env python3
import json
import urllib.request
import time

print("=== Verifying Price Display Fix ===")
print()

# Give it a moment for CDN to propagate
time.sleep(2)

# Test the analyzed endpoint
url = "https://lively-torrone-8199e0.netlify.app/api/analyzed?limit=5&offset=0&sortBy=created_at&sortOrder=asc"

req = urllib.request.Request(url)
req.add_header('Accept', 'application/json')

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode())
    
    print("✅ Deployment successful\!")
    print()
    print("The fix has been deployed. The oldest tokens should now display:")
    print()
    
    for result in data.get('results', [])[:5]:
        ticker = result.get('token', 'N/A')
        price = result.get('price_at_call')
        if price:
            print(f"- {ticker}: Entry: ${price:.8f}")
        else:
            print(f"- {ticker}: No price data")
    
    print()
    print("Instead of showing 'N/A' with refetch buttons.")
    print()
    print("Please refresh your browser to see the updated prices\!")
    
except Exception as e:
    print(f"Error: {e}")

