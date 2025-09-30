import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';

import { Toaster } from '@/components/ui/toaster';
import { PerformanceMonitor } from '@/components/ui/performance-monitor';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Communication Manager - Video Conference Platform',
  description: 'Modern video conference management platform with WebRTC powered by Communication Manager',
  keywords: ['video conference', 'meeting', 'webrtc', 'prisma', 'next.js', 'communication-manager'],
  authors: [{ name: 'Communication Manager' }],
  creator: 'Communication Manager',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://communication-manager.com',
    title: 'Communication Manager - Video Conference Platform',
    description: 'Modern video conference management platform powered by Communication Manager',
    siteName: 'Communication Manager',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Communication Manager - Video Conference Platform',
    description: 'Modern video conference management platform powered by Communication Manager',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <PerformanceMonitor />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 