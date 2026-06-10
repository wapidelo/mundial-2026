import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendNewUserNotificationToAdmin } from "@/lib/email"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.redirect(`${origin}${next}`)

      const displayName = (user.user_metadata?.display_name as string | undefined)?.trim()
      const service = createServiceClient()

      const { data: existing } = await service
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      const isNew = !existing

      if (isNew) {
        // New user: set profile name from metadata if provided
        await service.from("profiles").upsert(
          { id: user.id, ...(displayName ? { display_name: displayName } : {}) },
          { onConflict: "id" },
        )
        // Fire-and-forget: notify admin regardless of whether name was provided
        ;(async () => {
          try { await sendNewUserNotificationToAdmin(user.email ?? "desconocido") } catch {}
        })()

        if (displayName) {
          const sep = next.includes("?") ? "&" : "?"
          return NextResponse.redirect(
            `${origin}${next}${sep}bienvenida=${encodeURIComponent(displayName)}`,
          )
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
