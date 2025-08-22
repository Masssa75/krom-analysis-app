import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ConditionalLayout } from '@/components/conditional-layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KROM - Advanced Token Discovery',
  description: 'Advanced cryptocurrency call analysis and monitoring platform',
  keywords: 'crypto, analysis, trading, KROM, dashboard',
  authors: [{ name: 'KROM Analysis Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#000000' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <TooltipProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </TooltipProvider>
      </body>
    </html>
  )
}