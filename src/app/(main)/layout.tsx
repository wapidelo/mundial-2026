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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <PageFadeIn>{children}</PageFadeIn>
      </main>
    </div>
  )
}
