import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const displayName = (user?.user_metadata?.display_name as string | undefined)?.trim()

      if (displayName && user) {
        const service = createServiceClient()
        await service.from("profiles").upsert(
          { id: user.id, display_name: displayName },
          { onConflict: "id" },
        )
        const sep = next.includes("?") ? "&" : "?"
        return NextResponse.redirect(
          `${origin}${next}${sep}bienvenida=${encodeURIComponent(displayName)}`,
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
