# KROM Analysis Dashboard
<!-- Force rebuild to propagate env vars - 2025-07-29 -->

A powerful cryptocurrency analysis dashboard built with Next.js 15, TypeScript, and Tailwind CSS. Features AI-powered analysis, real-time data visualization, and comprehensive crypto call tracking.

## Features

- 📊 **Real-time Dashboard**: Monitor crypto calls with live data updates
- 🤖 **AI Analysis**: Integrated Claude and Gemini AI for intelligent insights
- 📈 **Advanced Charts**: Interactive visualizations with Recharts
- 🎯 **Call Tracking**: Track and analyze crypto calls from various sources
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🌗 **Dark Mode**: Built-in dark mode support
- 💾 **Data Export**: Export analysis results to CSV

## Tech Stack

- **Framework**: Next.js 15.1.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **Charts**: Recharts for data visualization
- **AI Integration**: Anthropic Claude & Google Gemini
- **Database**: Supabase (optional)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for:
  - Anthropic (Claude)
  - Google AI (Gemini)
  - Supabase (optional)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd krom-analysis-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` with your API keys:
```env
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_ai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
krom-analysis-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── analyze/       # AI analysis endpoint
│   │   └── download-csv/  # CSV export endpoint
│   ├── analysis/          # Analysis page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI primitives
│   └── navigation.tsx    # Navigation component
├── lib/                  # Utility functions
├── public/               # Static assets
└── styles/               # Global styles
```

## API Endpoints

### POST /api/analyze
Analyze crypto data with AI models.

**Request body:**
```json
{
  "prompt": "Analyze this token performance",
  "model": "claude" | "gemini",
  "data": { ... }
}
```

### POST /api/download-csv
Generate and download CSV from data.

**Request body:**
```json
{
  "data": [...],
  "filename": "analysis.csv"
}
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting (optional)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For support, please contact the KROM Analysis Team.