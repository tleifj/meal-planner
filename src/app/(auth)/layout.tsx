export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-muted/30 flex min-h-dvh w-full items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
