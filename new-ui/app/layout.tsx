import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ArenaX — Premium Gaming Platform',
    template: '%s | ArenaX',
  },
  description:
    'Join thousands of elite gamers on ArenaX — the premium gaming & esports platform built for champions.',
  keywords: ['gaming', 'esports', 'premium', 'arena', 'gaming platform'],
  authors: [{ name: 'ArenaX' }],
  openGraph: {
    title: 'ArenaX — Premium Gaming Platform',
    description: 'Join thousands of elite gamers on ArenaX.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
