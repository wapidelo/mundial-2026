import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/lib/types"

export const dynamic = "force-dynamic"

type MatchRow = {
  id: number
  match_number: number
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
}

type PredRow = {
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
}

type BonusRow = {
  champion_team_id: number | null
  third_place_team_id: number | null
}

type TeamRow = { id: number; name: string; flag_emoji: string }

function computeMatchStats(predictions: PredRow[]) {
  const stats: Record<number, { home: number; draw: number; away: number; total: number }> = {}
  for (const p of predictions) {
    if (!stats[p.match_id]) stats[p.match_id] = { home: 0, draw: 0, away: 0, total: 0 }
    const s = stats[p.match_id]
    s.total++
    if (p.predicted_home_score > p.predicted_away_score) s.home++
    else if (p.predicted_home_score === p.predicted_away_score) s.draw++
    else s.away++
  }
  return stats
}

function computeTeamVotes(bonusPreds: BonusRow[], field: "champion_team_id" | "third_place_team_id") {
  const votes: Record<number, number> = {}
  for (const b of bonusPreds) {
    const id = b[field]
    if (id !== null) votes[id] = (votes[id] ?? 0) + 1
  }
  return votes
}

function DistributionBar({
  home, draw, away, total, homeLabel, awayLabel,
}: {
  home: number; draw: number; away: number; total: number; homeLabel: string; awayLabel: string
}) {
  if (total === 0) return <p className="text-xs text-muted-foreground">Sin predicciones</p>
  const homePct = Math.round((home / total) * 100)
  const drawPct = Math.round((draw / total) * 100)
  const awayPct = 100 - homePct - drawPct

  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {homePct > 0 && (
          <div className="h-full transition-all duration-700" style={{ width: `${homePct}%`, background: "#8b1a2f" }} />
        )}
        {drawPct > 0 && (
          <div className="h-full transition-all duration-700" style={{ width: `${drawPct}%`, background: "#374151" }} />
        )}
        {awayPct > 0 && (
          <div className="h-full transition-all duration-700" style={{ width: `${awayPct}%`, background: "#1e3a5f" }} />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className="font-medium" style={{ color: "#ef4444" }}>{homeLabel} {homePct}%</span>
        <span>Empate {drawPct}%</span>
        <span className="font-medium" style={{ color: "#60a5fa" }}>{awayLabel} {awayPct}%</span>
      </div>
    </div>
  )
}

export default async function EstadisticasPage() {
  const supabase = await createClient()

  const [
    { data: matches },
    { data: predictions },
    { data: bonusPreds },
    { data: teams },
    { data: leaderboard },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("id, match_number, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji)")
      .order("match_number"),
    supabase.from("predictions").select("match_id, predicted_home_score, predicted_away_score"),
    supabase.from("bonus_predictions").select("champion_team_id, third_place_team_id"),
    supabase.from("teams").select("id, name, flag_emoji"),
    supabase.from("leaderboard").select("*").order("total_predictions", { ascending: false }),
  ])

  const matchList = (matches ?? []) as unknown as MatchRow[]
  const predList = (predictions ?? []) as PredRow[]
  const bonusList = (bonusPreds ?? []) as BonusRow[]
  const teamList = (teams ?? []) as TeamRow[]
  const leaderList = (leaderboard ?? []) as LeaderboardEntry[]

  const matchStats = computeMatchStats(predList)
  const championVotes = computeTeamVotes(bonusList, "champion_team_id")
  const thirdVotes = computeTeamVotes(bonusList, "third_place_team_id")

  const totalParticipants = leaderList.length
  const totalPredictions = predList.length

  const topChampions = Object.entries(championVotes)
    .map(([id, votes]) => ({ team: teamList.find((t) => t.id === Number(id)), votes }))
    .filter((x) => x.team)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 6)

  const topThird = Object.entries(thirdVotes)
    .map(([id, votes]) => ({ team: teamList.find((t) => t.id === Number(id)), votes }))
    .filter((x) => x.team)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 6)

  const mostContested = matchList
    .filter((m) => matchStats[m.id]?.total > 0)
    .map((m) => {
      const s = matchStats[m.id] ?? { home: 0, draw: 0, away: 0, total: 0 }
      const maxPct = Math.max(s.home, s.draw, s.away) / s.total
      return { match: m, stats: s, entropy: 1 - maxPct }
    })
    .sort((a, b) => b.entropy - a.entropy)
    .slice(0, 12)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">📊 Estadísticas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Distribución agregada de predicciones del grupo.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "👥", label: "Participantes", value: totalParticipants },
          { icon: "🎯", label: "Predicciones", value: totalPredictions },
          { icon: "📈", label: "Promedio", value: totalParticipants > 0 ? Math.round(totalPredictions / totalParticipants) : 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/20 p-3 text-center"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-xl font-black font-mono text-foreground">{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Participation per player */}
      <div className="rounded-xl border border-border/20 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/10"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <h2 className="font-bold text-foreground">🏃 Progreso de predicciones</h2>
        </div>
        <div className="divide-y divide-border/10">
          {leaderList.map((entry, idx) => {
            const pct = Math.round((entry.total_predictions / 72) * 100)
            return (
              <div key={entry.user_id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm text-muted-foreground w-5 text-right shrink-0">{idx + 1}</span>
                <span className="flex-1 text-sm font-medium text-foreground truncate min-w-0">{entry.display_name}</span>
                <div className="w-20 sm:w-32 h-1.5 bg-foreground/10 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100
                        ? "linear-gradient(90deg,#10b981,#34d399)"
                        : "linear-gradient(90deg,#8b1a2f,#c0392b)",
                    }}
                  />
                </div>
                <span className={cn(
                  "text-xs font-mono font-bold w-10 sm:w-12 text-right shrink-0",
                  pct === 100 ? "text-emerald-400" : "text-muted-foreground",
                )}>
                  {entry.total_predictions}/72
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Favorites: Champion & Third */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { title: "🥇 Favoritos para campeón", data: topChampions, total: bonusList.filter((b) => b.champion_team_id !== null).length },
          { title: "🥉 Favoritos para tercer lugar", data: topThird, total: bonusList.filter((b) => b.third_place_team_id !== null).length },
        ].map(({ title, data, total }) => (
          <div key={title} className="rounded-xl border border-border/20 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/10" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="font-bold text-foreground">{title}</h2>
            </div>
            <div className="p-4 space-y-3">
              {data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin datos aún</p>
              ) : data.map(({ team, votes }) => {
                const pct = total > 0 ? Math.round((votes / total) * 100) : 0
                return (
                  <div key={team!.id} className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{team!.flag_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{team!.name}</span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0 ml-2">{votes} voto{votes !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#fecc02,#f59e0b)" }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-yellow-400 font-mono w-10 text-right shrink-0">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Most contested matches */}
      {mostContested.length > 0 && (
        <div className="rounded-xl border border-border/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/10" style={{ background: "rgba(255,255,255,0.02)" }}>
            <h2 className="font-bold text-foreground">⚡ Partidos más reñidos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Donde el grupo está más dividido</p>
          </div>
          <div className="divide-y divide-border/10">
            {mostContested.map(({ match, stats }) => (
              <div key={match.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground font-mono">#{match.match_number}</span>
                  <span className="text-sm font-medium text-foreground">
                    {match.home_team?.flag_emoji} {match.home_team?.name}
                    <span className="text-muted-foreground mx-2">vs</span>
                    {match.away_team?.flag_emoji} {match.away_team?.name}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{stats.total} pred.</span>
                </div>
                <DistributionBar
                  home={stats.home}
                  draw={stats.draw}
                  away={stats.away}
                  total={stats.total}
                  homeLabel={match.home_team?.name ?? "Local"}
                  awayLabel={match.away_team?.name ?? "Visitante"}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
