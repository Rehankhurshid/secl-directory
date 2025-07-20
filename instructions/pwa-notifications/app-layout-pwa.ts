// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { InstallPrompt } from '@/components/InstallPrompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Employee Directory & Messaging',
  description: 'Connect with employees, view directory, and send messages instantly',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['employee', 'directory', 'messaging', 'pwa', 'communication'],
  authors: [
    { name: 'Your Company Name' }
  ],
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover',
  
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
    { rel: 'icon', url: '/icons/icon-192x192.png' },
  ],
  
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EmpConnect',
  },
  
  formatDetection: {
    telephone: false,
  },
  
  openGraph: {
    type: 'website',
    siteName: 'Employee Directory & Messaging',
    title: 'Employee Directory & Messaging',
    description: 'Connect with employees, view directory, and send messages instantly',
  },
  
  twitter: {
    card: 'summary',
    title: 'Employee Directory & Messaging',
    description: 'Connect with employees, view directory, and send messages instantly',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="EmpConnect" />
        <meta name="apple-mobile-web-app-title" content="EmpConnect" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <InstallPrompt />
        {children}
      </body>
    </html>
  )
}