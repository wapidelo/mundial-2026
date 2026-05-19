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
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-yellow-900/40 px-4 h-14 flex items-center gap-4"
        style={{ background: "rgba(10,15,30,0.95)" }}>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← App</Link>
        <span className="text-yellow-400 font-bold text-sm">⚙️ Panel Admin</span>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
