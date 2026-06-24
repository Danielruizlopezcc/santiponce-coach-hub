import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CD Santiponce | Plataforma Oficial del Club',
  description:
    'Plataforma oficial del Club Deportivo Santiponce para familias, deportistas y gestión de matrículas. Temporada 2026/2027.',
  generator: 'v0.app',
  icons: {
    icon: '/images/Escudo_Santiponce_transparente.png',
    shortcut: '/images/Escudo_Santiponce_transparente.png',
    apple: '/images/Escudo_Santiponce_transparente.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
