import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import GoogleAnalytics from '@/components/google-analytics'
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster';
import { ProModal } from '@/components/pro-modal';

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'truluv.me',
    description: 'Your customized companions.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ClerkProvider
              publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
              signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
              signUpFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}>
            <html lang="en" suppressHydrationWarning>
                <body className={cn("bg-secondary", inter.className)}>
                    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                        <ProModal />
                        <GoogleAnalytics />
                        {children}
                        <Toaster />
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    )
}
