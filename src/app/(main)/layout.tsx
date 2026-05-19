import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import { PageFadeIn } from "@/components/page-fade-in"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Usuario"
  const isAdmin = user.email === process.env.ADMIN_EMAIL

  return (
    <div className="min-h-screen flex flex-col">
      <Nav displayName={displayName} isAdmin={isAdmin} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-6 pb-24 sm:pb-8">
        <PageFadeIn>{children}</PageFadeIn>
      </main>
      <footer className="hidden sm:block border-t border-foreground/8 py-4 pb-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">⚽</span>
            <span className="font-display font-bold text-sm tracking-tight text-foreground/60">
              MUNDIAL <span style={{ color: "#fecc02" }}>2026</span>
            </span>
            <span className="text-muted-foreground/30 text-xs">·</span>
            <span className="text-xs text-muted-foreground/40">Quiniela de amigos</span>
          </div>
          <span className="text-[11px] text-muted-foreground/30 font-mono">© 2026</span>
        </div>
      </footer>
    </div>
  )
}
