import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/useAuth'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Greenloop — Golf. Give. Win.',
  description: 'A subscription golf platform where every round you play raises money for charity and enters you into monthly prize draws.',
  keywords: ['golf', 'charity', 'subscription', 'prize draw', 'stableford'],
  openGraph: {
    title: 'Greenloop — Golf. Give. Win.',
    description: 'Play golf. Support charity. Win prizes.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                color: '#F0F0EE',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontFamily: 'var(--font-body)',
              },
              success: {
                iconTheme: { primary: '#C8FF00', secondary: '#0A0A0B' },
              },
              error: {
                iconTheme: { primary: '#FF5C3A', secondary: '#0A0A0B' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
