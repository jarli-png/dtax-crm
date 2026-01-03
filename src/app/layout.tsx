import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'dTax CRM - Kundestøtte og Salgssystem',
  description: 'Internt CRM-system for dTax/Salestext Tax',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
}
