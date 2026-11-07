import type { Metadata, Viewport } from 'next'
import { Fraunces, Public_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const body = Public_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap', axes: ['opsz'] })

export const metadata: Metadata = {
  title: { default: 'Pulseboard', template: '%s · Pulseboard' },
  description:
    'A sales and operations dashboard over a year of seeded orders: KPI tiles with period-over-period change, four Apache ECharts charts, filters that live in the URL, and CSV export. No backend.',
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf6ef' },
    { media: '(prefers-color-scheme: dark)', color: '#131a2b' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${body.variable} ${display.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
