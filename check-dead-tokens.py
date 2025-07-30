#\!/usr/bin/env python3
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# First, let's check what columns exist that might indicate "dead" status
print("Checking for status-related columns in the database...")

# Get a sample record to see all columns
sample = supabase.table('crypto_calls').select('*').limit(1).execute()
if sample.data:
    columns = list(sample.data[0].keys())
    status_columns = [col for col in columns if 'dead' in col.lower() or 'status' in col.lower() or 'invalid' in col.lower() or 'rug' in col.lower()]
    print(f"\nFound these potentially relevant columns: {status_columns}")

# Check for invalidated tokens without prices
print("\n\nChecking invalidated tokens without prices...")
response = supabase.table('crypto_calls').select(
    'ticker, network, is_invalidated, invalidated_at, invalidation_reason, price_at_call, current_price, created_at'
).is_('price_at_call', 'null').is_('current_price', 'null').eq('is_invalidated', True).limit(20).execute()

if response.data:
    print(f"\nFound {len(response.data)} invalidated tokens without prices:")
    for token in response.data:
        print(f"\n{token['ticker']} ({token['network']})")
        print(f"  Invalidated: {token['invalidated_at']}")
        print(f"  Reason: {token['invalidation_reason']}")
        print(f"  Created: {token['created_at']}")

# Count total invalidated tokens
count_response = supabase.table('crypto_calls').select('*', count='exact', head=True).eq('is_invalidated', True).execute()
total_invalidated = count_response.count
print(f"\n\nTotal invalidated tokens in database: {total_invalidated}")

# Check how many of the 179 tokens without prices are invalidated
no_price_invalidated = supabase.table('crypto_calls').select('*', count='exact', head=True).is_('price_at_call', 'null').is_('current_price', 'null').eq('is_invalidated', True).execute()
print(f"Invalidated tokens among the 179 without prices: {no_price_invalidated.count}")

# Let's also check if there's any pattern in the invalidation reasons
print("\n\nInvalidation reasons breakdown:")
invalidated_tokens = supabase.table('crypto_calls').select('invalidation_reason').eq('is_invalidated', True).execute()

reasons = {}
for token in invalidated_tokens.data:
    reason = token['invalidation_reason'] or 'No reason specified'
    reasons[reason] = reasons.get(reason, 0) + 1

for reason, count in sorted(reasons.items(), key=lambda x: x[1], reverse=True):
    print(f"  {reason}: {count} tokens")

# Check if there's any correlation between dead tokens and missing prices
print("\n\nChecking correlation between invalidation and missing prices...")
# Get counts for 2x2 matrix
has_price_valid = supabase.table('crypto_calls').select('*', count='exact', head=True).not_('price_at_call', 'is', null).or_('is_invalidated.is.null,is_invalidated.eq.false').execute().count
has_price_invalid = supabase.table('crypto_calls').select('*', count='exact', head=True).not_('price_at_call', 'is', null).eq('is_invalidated', True).execute().count
no_price_valid = supabase.table('crypto_calls').select('*', count='exact', head=True).is_('price_at_call', 'null').or_('is_invalidated.is.null,is_invalidated.eq.false').execute().count
no_price_invalid = no_price_invalidated.count

print(f"\nTokens WITH prices:")
print(f"  Valid: {has_price_valid}")
print(f"  Invalidated: {has_price_invalid}")
print(f"\nTokens WITHOUT prices:")
print(f"  Valid: {no_price_valid}")
print(f"  Invalidated: {no_price_invalid}")

# Check a few specific examples of non-invalidated tokens without prices
print("\n\nExamples of NON-invalidated tokens without prices:")
response = supabase.table('crypto_calls').select(
    'ticker, network, contract_address, created_at, analysis_score, x_analysis_score'
).is_('price_at_call', 'null').is_('current_price', 'null').or_('is_invalidated.is.null,is_invalidated.eq.false').order('created_at', desc=True).limit(10).execute()

for token in response.data:
    print(f"\n{token['ticker']} ({token['network']})")
    print(f"  Contract: {token['contract_address']}")
    print(f"  Created: {token['created_at']}")
    print(f"  Scores: Call={token['analysis_score']}, X={token['x_analysis_score']}")
EOF < /dev/null