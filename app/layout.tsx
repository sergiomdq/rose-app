export const metadata = { title: 'Rose App', description: 'En la niebla, el ahorro es luz' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, backgroundColor: '#121212' }}>{children}</body>
    </html>
  )
}