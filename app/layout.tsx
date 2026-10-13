import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google'
import { AppProviders } from '@/components/theme-provider'
import './globals.css'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`dark bg-background ${jakarta.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        {/* Terapkan tema tersimpan (gelap/terang) sebelum React mount, agar tidak flash & tidak crash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('presensi-theme')==='light'){document.documentElement.classList.add('theme-light');document.documentElement.classList.remove('dark')}}catch(e){}window.addEventListener('unhandledrejection',function(e){try{var m=(e.reason&&(e.reason.message||String(e.reason)))||'';if(/getUserMedia|NotAllowedError|NotFoundError|not allowed|Permission denied|constraint/i.test(m)){e.preventDefault();var p=document.getElementById('scan-error-banner');if(!p){p=document.createElement('div');p.id='scan-error-banner';p.setAttribute('role','alert');p.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:9999;max-width:92vw;background:#b91c1c;color:#fff;padding:12px 18px;border-radius:14px;font:600 13px system-ui;box-shadow:0 8px 30px rgba(0,0,0,.35)';p.textContent='Kamera tidak dapat diakses. Gunakan tombol input kode manual di bawah pemindai.';document.body.appendChild(p);setTimeout(function(){p.remove()},7000)}}}catch(_){}});`,
          }}
        />
        <AppProviders>{children}</AppProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
