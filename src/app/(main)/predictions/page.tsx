import { createClient } from "@/lib/supabase/server"
import { PredictionsForm } from "@/components/predictions-form"
import { DeadlineBanner } from "@/components/deadline-banner"
import type { GroupWithMatches, MatchWithPrediction, Team } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function PredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tournamentStart = new Date(process.env.TOURNAMENT_START ?? "2026-06-11T19:00:00Z")
  const isClosed = new Date() >= tournamentStart
  const now = new Date()

  const [{ data: groups }, { data: teams }, { data: matches }, { data: knockouts }, { data: predictions }, { data: bonusPred }, { data: settingsRow }] =
    await Promise.all([
      supabase.from("groups").select("*").order("name"),
      supabase.from("teams").select("*, groups(name)").order("name"),
      supabase
        .from("matches")
        .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), groups(*)")
        .eq("round", "group")
        .order("match_number"),
      supabase
        .from("matches")
        .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)")
        .neq("round", "group")
        .order("match_number"),
      supabase.from("predictions").select("*").eq("user_id", user!.id),
      supabase.from("bonus_predictions").select("*").eq("user_id", user!.id).single(),
      supabase.from("settings").select("value").eq("key", "open_rounds").single(),
    ])

  const openRounds: string[] = (settingsRow?.value ?? []) as string[]

  const hasOpenGroupMatches = (matches ?? []).some((m) => new Date(m.scheduled_at) > now)
  const hasAnyOpenPrediction = hasOpenGroupMatches || openRounds.length > 0
  const upcomingGroupCount = (matches ?? []).filter((m) => new Date(m.scheduled_at) > now).length

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

  const knockoutWithPredictions: MatchWithPrediction[] = (knockouts ?? []).map((m) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(m as any),
    prediction: predictions?.find((p) => p.match_id === m.id),
  }))

  const openKnockoutCount = (knockouts ?? []).filter((m) => openRounds.includes(m.round)).length
  const totalMatchCount = upcomingGroupCount + openKnockoutCount

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">🎯 MIS PREDICCIONES</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {!isClosed
              ? `Predice los ${totalMatchCount} partidos de fase de grupos antes del 11 jun 2026`
              : hasOpenGroupMatches
                ? `${upcomingGroupCount} partido${upcomingGroupCount !== 1 ? "s" : ""} de grupo aún abierto${upcomingGroupCount !== 1 ? "s" : ""} — ¡predice antes de que empiecen!`
                : openRounds.length > 0
                  ? `${openRounds.length === 1 ? "Nueva ronda abierta" : `${openRounds.length} rondas abiertas`} — ¡predice ahora!`
                  : "Predicciones cerradas — espera la siguiente ronda"}
          </p>
        </div>
        {hasAnyOpenPrediction && (
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Predicciones:</span>
            <span className="font-bold text-foreground font-mono">
              {predictions?.length ?? 0}
              <span className="text-slate-500">/{totalMatchCount}</span>
            </span>
          </div>
        )}
      </div>

      {!isClosed ? (
        <DeadlineBanner tournamentStart={process.env.TOURNAMENT_START ?? "2026-06-11T19:00:00Z"} />
      ) : !hasAnyOpenPrediction ? (
        <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 text-sm">
          🔒 Predicciones cerradas. Cuando empiece la siguiente ronda el admin la habilitará aquí.
        </div>
      ) : null}

      <PredictionsForm
        groupsWithMatches={groupsWithMatches}
        knockoutMatches={knockoutWithPredictions}
        predictionMap={predictionMap}
        bonusPrediction={bonusPred ?? null}
        allTeams={(teams ?? []) as Team[]}
        isClosed={isClosed}
        openRounds={openRounds}
        userId={user!.id}
        totalMatchCount={totalMatchCount}
        hasAnyOpenPrediction={hasAnyOpenPrediction}
      />
    </div>
  )
}
