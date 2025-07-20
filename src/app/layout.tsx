import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/providers';
import { AppLayout } from '@/components/layout/app-layout';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Arial', 'sans-serif']
});

export const metadata: Metadata = {
  title: 'SECL Directory',
  description: 'Employee Directory and Messaging System for SECL',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SECL Directory',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'SECL Directory',
    title: 'SECL Employee Directory',
    description: 'Employee Directory and Messaging System for SECL',
  },
  twitter: {
    card: 'summary',
    title: 'SECL Directory',
    description: 'Employee Directory and Messaging System for SECL',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="theme"
        >
          <Providers>
            <div className="min-h-screen bg-background font-sans antialiased transition-colors">
              <AppLayout>
                {children}
              </AppLayout>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
} 