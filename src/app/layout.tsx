import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: { default: 'GolfDraw — Play Golf, Win Prizes, Fund Charity', template: '%s | GolfDraw' },
  description: 'Enter your golf scores monthly for a chance to win prizes while supporting the charity you love.',
  keywords: ['golf', 'draw', 'charity', 'prizes', 'stableford'],
  openGraph: {
    siteName: 'GolfDraw',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-brand-bg font-body antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a26',
              color: '#e8e8f0',
              border: '1px solid #2a2a3a',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#a8ff3e', secondary: '#0a0a0f' } },
            error: { iconTheme: { primary: '#ff5e5e', secondary: '#0a0a0f' } },
          }}
        />
      </body>
    </html>
  )
}
