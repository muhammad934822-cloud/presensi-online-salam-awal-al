import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google'
import { AppProviders } from '@/components/theme-provider'
import MaintenanceLock from '@/components/maintenance-lock'
import './globals.css'

// ===== MODE MAINTENANCE (server ditutup setelah hari-H) =====
// Untuk membuka kembali: hapus/catat baris <MaintenanceLock /> di bawah,
// atau set env VERCEL_BYPASS_SECRET lalu akses dengan header bypass Vercel.
const MAINTENANCE = true

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Presensi Salam Awal Al Uswah',
  description: 'Presensi Salam Awal Al Uswah',
  generator: 'v0.app',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a1330',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Bypass maintenance untuk admin via header Vercel Protection Bypass (opsional)
  let bypass = false
  if (MAINTENANCE && process.env.VERCEL_BYPASS_SECRET) {
    try {
      const h = await headers()
      bypass =
        h.get('x-vercel-protection-bypass') === process.env.VERCEL_BYPASS_SECRET
    } catch {
      bypass = false
    }
  }

  return (
    <html lang="id" className={`dark bg-background ${jakarta.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        {/* Terapkan tema tersimpan (gelap/terang) sebelum React mount, agar tidak flash & tidak crash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('presensi-theme')==='light'){document.documentElement.classList.add('theme-light');document.documentElement.classList.remove('dark')}}catch(e){}`,
          }}
        />
        {MAINTENANCE && !bypass ? (
          <MaintenanceLock />
        ) : (
          <>
            <AppProviders>{children}</AppProviders>
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </>
        )}
      </body>
    </html>
  )
}
