import { createClient } from "@/lib/supabase/server"
import { MatchesRealtime } from "@/components/matches-realtime"
import type { Match, Group } from "@/lib/types"

export const dynamic = "force-dynamic"

type MatchWithTeams = Match & {
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
  home_slot: string | null
  away_slot: string | null
}

type GroupWithMatches = Group & { matches: MatchWithTeams[] }

export default async function MatchesPage() {
  const supabase = await createClient()

  const [{ data: groups }, { data: matches }] = await Promise.all([
    supabase.from("groups").select("*").order("name"),
    supabase
      .from("matches")
      .select("*, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji)")
      .order("match_number"),
  ])

  const allMatches = (matches ?? []) as MatchWithTeams[]

  const initialGroups: GroupWithMatches[] = (groups ?? []).map((g) => ({
    ...g,
    matches: allMatches.filter((m) => m.group_id === g.id),
  }))

  const initialKnockouts = allMatches.filter((m) => m.round !== "group")

  return <MatchesRealtime initialGroups={initialGroups} initialKnockouts={initialKnockouts} />
}
