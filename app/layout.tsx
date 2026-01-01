// app/layout.tsx
import './global.css'

export const metadata = {
  title: 'ArrowGachas',
  description: 'Spin Wheel & Gacha System',
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
