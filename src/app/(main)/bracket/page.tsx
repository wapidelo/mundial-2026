import { createClient } from "@/lib/supabase/server"
import { BracketView } from "@/components/bracket-view"
import type { RoundType } from "@/lib/types"

export const dynamic = "force-dynamic"

export type BracketMatch = {
  id: number
  match_number: number
  round: RoundType
  home_slot: string | null
  away_slot: string | null
  home_team_id: number | null
  away_team_id: number | null
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
  scheduled_at: string
  home_score: number | null
  away_score: number | null
  status: string
}

export default async function BracketPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("matches")
    .select("id, match_number, round, home_slot, away_slot, home_team_id, away_team_id, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji), scheduled_at, home_score, away_score, status")
    .neq("round", "group")
    .order("match_number")

  return <BracketView matches={(data ?? []) as unknown as BracketMatch[]} />
}
