import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { ShopAccessModalProvider } from '@/components/shop-access-modal'
import './globals.css'

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
    <html lang="es" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ShopAccessModalProvider>{children}</ShopAccessModalProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
