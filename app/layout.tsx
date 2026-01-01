// app/layout.tsx
import './globals.css'

export const metadata = {
  title: 'SpinWheel App',
  description: 'Dashboard Gacha & Spin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
