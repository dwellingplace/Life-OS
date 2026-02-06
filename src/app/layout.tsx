import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import '@/styles/globals.css'
import '@/styles/light-mode.css'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import AuthBridgeSync from '@/components/AuthBridgeSync'

export const metadata: Metadata = {
  title: 'Life OS',
  description: 'Your calm, personal life operating system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Life OS',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f1219',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <ClerkProvider>
          {children}
          <AuthBridgeSync />
          <ServiceWorkerRegistration />
        </ClerkProvider>
      </body>
    </html>
  )
}
