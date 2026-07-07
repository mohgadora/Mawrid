import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo, Noto_Sans_Devanagari, Noto_Sans_Bengali } from 'next/font/google'
import { Providers } from '@/components/providers'
import { BRAND } from '@/lib/config'
import './globals.css'

const cairo = Cairo({
  subsets: ['latin', 'arabic'],
  variable: '--font-cairo',
  display: 'swap',
})

// Devanagari script — used when lang = 'hi'
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Bengali script — used when lang = 'bn'
const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: `${BRAND.ar} | ${BRAND.en} - منصة تجارة الجملة ومقارنة أسعار السوق`,
  description:
    'منصة تجارة الجملة التي تقارن أسعارها بمتوسط السوق لتوفّر أكثر. اشترِ من موردين موثوقين بأفضل الأسعار. Wholesale marketplace with live market price comparison.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  // Support both themes so the browser chrome matches the active theme instead
  // of forcing a light-mode island.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf9f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1512' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${notoDevanagari.variable} ${notoBengali.variable} bg-background`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Apply the persisted theme before first paint to prevent a flash of the
          wrong theme (FOUC) and any light-mode island on load. Mirrors the logic
          in lib/theme.tsx (storage key: mawrid_theme).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mawrid_theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.VERCEL && process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
