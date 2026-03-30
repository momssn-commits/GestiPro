import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'GestiPro — Plateforme RH & Documentaire',
  description: 'Intranet RH, gestion documentaire et formation en ligne',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
              },
              success: { iconTheme: { primary: '#16a34a', secondary: '#ffffff' } },
              error:   { iconTheme: { primary: '#dc2626', secondary: '#ffffff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
