
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { HeaderWrapper } from '@/components/layout/header-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EscalaFin - Sistema de Gestión de Créditos',
  description: 'Plataforma completa para la gestión de préstamos y créditos',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <HeaderWrapper />
            <main className="relative">
              {children}
            </main>
            <Toaster 
              position="top-right" 
              richColors 
              closeButton
              theme="light"
            />
          </div>
        </Providers>
      </body>
    </html>
  )
}
