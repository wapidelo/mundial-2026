import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/20 bg-background/95 backdrop-blur-md px-4 h-14 flex items-center gap-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← App
        </Link>
        <span className="font-bold text-sm" style={{ color: "#fecc02" }}>⚙️ Panel Admin</span>
        <div className="ml-auto text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full font-medium" style={{ color: "#fecc02" }}>
          Solo administrador
        </div>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6" style={{ animation: "fadeInUp 0.3s ease-out" }}>
        {children}
      </main>
    </div>
  )
}
