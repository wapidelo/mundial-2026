import { createClient } from "@/lib/supabase/server"
import { PredictionsForm } from "@/components/predictions-form"
import type { GroupWithMatches, Team } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function PredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tournamentStart = new Date(process.env.TOURNAMENT_START ?? "2026-06-11T19:00:00Z")
  const isClosed = new Date() >= tournamentStart

  const [{ data: groups }, { data: teams }, { data: matches }, { data: predictions }, { data: bonusPred }] =
    await Promise.all([
      supabase.from("groups").select("*").order("name"),
      supabase.from("teams").select("*, groups(name)").order("name"),
      supabase
        .from("matches")
        .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), groups(*)")
        .order("match_number"),
      supabase.from("predictions").select("*").eq("user_id", user!.id),
      supabase.from("bonus_predictions").select("*").eq("user_id", user!.id).single(),
    ])

  // Build groups with matches
  const groupsWithMatches: GroupWithMatches[] = (groups ?? []).map((g) => ({
    ...g,
    teams: (teams ?? []).filter((t) => t.group_id === g.id),
    matches: (matches ?? [])
      .filter((m) => m.group_id === g.id)
      .map((m) => ({
        ...m,
        prediction: predictions?.find((p) => p.match_id === m.id),
      })),
  }))

  const predictionMap = Object.fromEntries(
    (predictions ?? []).map((p) => [p.match_id, p]),
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🎯 Mis Predicciones</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isClosed
              ? "Las predicciones están cerradas — el torneo ya comenzó"
              : `Predice los 72 partidos antes del 11 jun 2026`}
          </p>
        </div>
        {!isClosed && (
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-slate-500">Predicciones:</span>
            <span className="font-bold text-white font-mono">
              {predictions?.length ?? 0}
              <span className="text-slate-500">/72</span>
            </span>
          </div>
        )}
      </div>

      {isClosed && (
        <div className="mb-6 p-4 rounded-xl border border-yellow-800/50 bg-yellow-900/20 text-yellow-300 text-sm">
          🔒 Las predicciones cerraron el 11 de junio. Puedes ver tus predicciones pero ya no puedes modificarlas.
        </div>
      )}

      <PredictionsForm
        groupsWithMatches={groupsWithMatches}
        predictionMap={predictionMap}
        bonusPrediction={bonusPred ?? null}
        allTeams={(teams ?? []) as Team[]}
        isClosed={isClosed}
      />
    </div>
  )
}
