# Active Files - KROM Public Interface Development
**Last Updated**: August 7, 2025 - 1:00 PM Session
**Status**: Mid-session wrap for filter implementation

## Currently Active Components

### Main Application Files
- `/app/page.tsx` - Main landing page with sidebar and content areas
- `/app/api/top-calls/route.ts` - API endpoint for top performing calls
- `/app/api/recent-calls/route.ts` - API endpoint for recent calls with group names
- `/components/TopEarlyCalls.tsx` - Top calls grid with time selector
- `/components/RecentCalls.tsx` - Recent calls list with detailed info
- `/components/ChartModal.tsx` - Token detail modal with GeckoTerminal chart

### Reference Files
- `/mockups/krom-sidebar-no-icons.html` - Main design reference
- `/mockups/krom-chart-modal.html` - Modal design reference

## Next Session Focus
1. Implement filter controls in sidebar
2. Connect filters to Recent Calls data
3. Add sorting functionality
4. Consider pagination for large datasets

## Deployment Info
- **Live URL**: https://lively-torrone-8199e0.netlify.app
- **Admin Panel**: /admin/x7f9k2m3p8
- **Netlify Site ID**: 8ff019b3-29ef-4223-b6ad-2cc46e91807e

## Quick Commands
```bash
# Deploy changes
git add -A && git commit -m "feat: description" && git push origin main

# Check deployment
netlify api listSiteDeploys --data '{"site_id": "8ff019b3-29ef-4223-b6ad-2cc46e91807e"}' | jq '.[0].state'
```