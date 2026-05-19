import { createClient } from "@/lib/supabase/server"
import { LeaderboardRealtime } from "@/components/leaderboard-realtime"
import type { LeaderboardEntry } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const [{ data: entries }, { data: { user } }] = await Promise.all([
    supabase.from("leaderboard").select("*").order("total_points", { ascending: false }),
    supabase.auth.getUser(),
  ])

  return (
    <LeaderboardRealtime
      initialEntries={(entries ?? []) as LeaderboardEntry[]}
      userId={user?.id ?? ""}
    />
  )
}
