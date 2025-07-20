# KROM Analysis App - Next.js Project

## Overview
A modern Next.js 15 application for analyzing cryptocurrency calls from the KROM API. This is a complete rewrite of the previous HTML/Python-based dashboard, now built with React, TypeScript, and modern web technologies.

## Project Context
This application continues the work from the KROMV12 project but as a standalone Next.js application with:
- Server-side rendering for better performance
- Type safety with TypeScript
- Modern React patterns and hooks
- API routes for backend functionality
- Responsive design with Tailwind CSS

## Tech Stack
- **Framework**: Next.js 15.1.3 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: SQLite (via API routes)

## Project Structure
```
krom-analysis-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page with dashboard
│   └── globals.css        # Global styles with Tailwind
├── components/            # React components (to be created)
├── lib/                   # Utility functions (to be created)
├── public/               # Static assets (to be created)
├── .env.local.example    # Environment variables template
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Features from Previous Project
Based on the KROMV12 dashboard, this app will include:
1. **Real-time Analytics** - Call performance tracking
2. **Group Analysis** - Performance by signal groups
3. **Token Metrics** - ROI, success rates, timing analysis
4. **Historical Data** - 98,040+ calls in SQLite database
5. **Interactive Charts** - Various visualization types

## Environment Variables
Key variables needed (see .env.local.example):
- `KROM_API_TOKEN` - For fetching new calls
- `DATABASE_URL` - SQLite connection string
- External API keys for enhanced features

## Development Workflow
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Current State
- ✅ Initial project structure created
- ✅ TypeScript configuration
- ✅ Tailwind CSS with dark mode support
- ✅ Basic homepage with placeholder stats
- 🔄 Components and API routes to be implemented

## Next Steps
1. Create API routes for database queries
2. Build reusable chart components
3. Implement data fetching with React hooks
4. Add interactive features from previous dashboard
5. Create group and token detail pages

## Migration Notes
This project migrates functionality from:
- `krom-analysis-viz.html` - Main dashboard
- `all-in-one-server.py` - API endpoints
- `krom_calls.db` - SQLite database

The goal is to maintain feature parity while improving performance, type safety, and developer experience with modern React patterns.

## Database Schema Reference
The SQLite database contains:
- `calls` table with ticker, buy_timestamp, ROI data
- `groups` table with performance statistics
- Raw JSON data for flexible analysis

## API Design
Next.js API routes will replace the Flask endpoints:
- `/api/stats` - Dashboard statistics
- `/api/calls` - Paginated call data
- `/api/groups` - Group performance data
- `/api/analysis` - Custom analysis queries

---
**Created**: January 20, 2025
**Status**: Initial setup complete
**Version**: 0.1.0