# Instructions for Adding Groups Filter

## Overview
Add a collapsible "Groups" filter section in the sidebar that allows users to filter Recent Calls by specific Telegram groups that made the calls.

## Current Implementation Reference
The Token Type filter is already implemented in `/app/page.tsx` with this pattern:
- Collapsible section with hover effects
- Checkbox-style selection
- State management in the page component
- Filter state passed to RecentCalls component

## Step 1: Database & API Preparation

### 1.1 Check Available Groups
First, get a list of unique groups from the database:
```sql
SELECT DISTINCT 
  raw_data->>'groupName' as group_name,
  COUNT(*) as call_count
FROM crypto_calls
WHERE raw_data->>'groupName' IS NOT NULL
GROUP BY raw_data->>'groupName'
ORDER BY call_count DESC;
```

### 1.2 API Endpoint Updates
File: `/app/api/recent-calls/route.ts`

Add groups filter support:
```typescript
// Get groups parameter from URL
const selectedGroups = searchParams.get('groups')?.split(',').filter(Boolean) || []

// Add to count query
if (selectedGroups.length > 0) {
  // Use raw_data JSONB field to filter by group
  const groupFilters = selectedGroups.map(group => 
    `raw_data->>'groupName'.eq.${group}`
  ).join(',')
  countQuery = countQuery.or(groupFilters)
}

// Add to main query (same pattern)
```

## Step 2: Frontend Implementation

### 2.1 Add Groups Filter to Sidebar
File: `/app/page.tsx`

Add after the Token Type filter section:
```typescript
// Add state for groups
const [isGroupsCollapsed, setIsGroupsCollapsed] = useState(true) // Start collapsed
const [selectedGroups, setSelectedGroups] = useState<string[]>([])
const [availableGroups, setAvailableGroups] = useState<{name: string, count: number}[]>([])

// Fetch available groups on mount
useEffect(() => {
  fetch('/api/groups') // You'll need to create this endpoint
    .then(res => res.json())
    .then(data => setAvailableGroups(data))
}, [])

// Add groups to filter state
interface FilterState {
  tokenType: 'all' | 'meme' | 'utility'
  groups: string[] // Add this
}
```

### 2.2 Groups Filter UI
Add this section after Token Type in the sidebar:
```jsx
{/* Groups Filter */}
<div className={`border-b border-[#1a1c1f] ${isGroupsCollapsed ? 'collapsed' : ''}`}>
  <div 
    className="px-5 py-5 cursor-pointer flex justify-between items-center bg-[#111214] hover:bg-[#1a1c1f] hover:pl-6 transition-all"
    onClick={() => setIsGroupsCollapsed(!isGroupsCollapsed)}
  >
    <h3 className={`text-[13px] uppercase tracking-[1px] font-semibold transition-colors ${!isGroupsCollapsed ? 'text-[#00ff88]' : 'text-[#888]'}`}>
      Groups ({selectedGroups.length || 'All'})
    </h3>
    <span className={`text-xs transition-all ${!isGroupsCollapsed ? 'text-[#00ff88]' : 'text-[#666]'} ${isGroupsCollapsed ? 'rotate-[-90deg]' : ''}`}>
      ▼
    </span>
  </div>
  <div className={`bg-[#0a0b0d] overflow-hidden transition-all ${isGroupsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[300px] opacity-100 p-5 overflow-y-auto'}`}>
    <div className="flex flex-col gap-2">
      {availableGroups.map(group => (
        <label 
          key={group.name}
          className="flex items-center gap-2.5 cursor-pointer text-sm text-[#ccc] hover:text-white transition-colors"
        >
          <div 
            className={`w-5 h-5 border-2 rounded-[5px] transition-all flex items-center justify-center ${
              selectedGroups.includes(group.name) ? 'bg-[#00ff88] border-[#00ff88]' : 'border-[#333]'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (selectedGroups.includes(group.name)) {
                setSelectedGroups(selectedGroups.filter(g => g !== group.name))
              } else {
                setSelectedGroups([...selectedGroups, group.name])
              }
              // Update filters
              setFilters(prev => ({ ...prev, groups: selectedGroups }))
            }}
          >
            {selectedGroups.includes(group.name) && <span className="text-black font-bold text-xs">✓</span>}
          </div>
          <span className="flex-1">{group.name}</span>
          <span className="text-[#666] text-xs">({group.count})</span>
        </label>
      ))}
    </div>
  </div>
</div>
```

## Step 3: Create Groups API Endpoint

Create new file: `/app/api/groups/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get all unique groups with counts
  const { data, error } = await supabase
    .from('crypto_calls')
    .select('raw_data')
    .or('is_invalidated.is.null,is_invalidated.eq.false')
  
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
  
  // Process groups
  const groupCounts = new Map<string, number>()
  
  data?.forEach(call => {
    const groupName = call.raw_data?.groupName || call.raw_data?.group_username
    if (groupName) {
      groupCounts.set(groupName, (groupCounts.get(groupName) || 0) + 1)
    }
  })
  
  // Convert to array and sort by count
  const groups = Array.from(groupCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50) // Limit to top 50 groups
  
  return NextResponse.json(groups)
}
```

## Step 4: Update RecentCalls Component

File: `/components/RecentCalls.tsx`

Update the interface and fetch:
```typescript
interface RecentCallsProps {
  filters?: {
    tokenType?: 'all' | 'meme' | 'utility'
    groups?: string[] // Add this
  }
}

// In fetchRecentCalls function:
const params = new URLSearchParams({
  limit: itemsPerPage.toString(),
  page: currentPage.toString(),
  sortBy,
  sortOrder,
  tokenType: filters?.tokenType || 'all',
  groups: filters?.groups?.join(',') || '' // Add this
})
```

## Step 5: Test Implementation

Create test file: `/tests/test-groups-filter.spec.ts`
```typescript
import { test, expect } from '@playwright/test'

test('Groups filter should work correctly', async ({ page }) => {
  await page.goto('https://krom1.com')
  
  // Expand groups filter
  await page.locator('text=GROUPS').click()
  await page.waitForTimeout(500)
  
  // Select a specific group
  const firstGroup = page.locator('.checkbox-item').first()
  await firstGroup.click()
  
  // Verify API call includes group parameter
  const response = await page.waitForResponse(resp => 
    resp.url().includes('/api/recent-calls') && 
    resp.url().includes('groups=')
  )
  
  const url = new URL(response.url())
  expect(url.searchParams.get('groups')).toBeTruthy()
})
```

## Important Notes

1. **Group Name Extraction**: The group name is stored in `raw_data` JSONB field as either `groupName` or `group_username`

2. **Performance**: Consider caching the groups list since it doesn't change often

3. **UI Polish**: 
   - Show selected count in header (e.g., "Groups (3)")
   - Add "Select All" / "Clear All" buttons if many groups
   - Consider search/filter for groups if list is long

4. **Database Query**: The filtering needs to check the JSONB field:
   ```sql
   WHERE raw_data->>'groupName' = ANY($1)
   ```

5. **State Management**: When groups change, reset to page 1 just like with token type filter

## File Structure
```
/app/
  page.tsx (main changes here)
  /api/
    /groups/
      route.ts (new endpoint)
    /recent-calls/
      route.ts (update filtering)
/components/
  RecentCalls.tsx (accept groups prop)
/tests/
  test-groups-filter.spec.ts (new test)
```

## Mockup Reference
Follow the same collapsible pattern as Token Type filter from `/mockups/krom-sidebar-no-icons.html`

Good luck with the implementation!