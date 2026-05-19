"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Match, Group, RoundType } from "@/lib/types"

type MatchWithTeams = Match & {
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
  home_slot: string | null
  away_slot: string | null
}

type GroupWithMatches = Group & { matches: MatchWithTeams[] }

// ─── Standings ────────────────────────────────────────────────────────────────

type TeamStanding = {
  id: number
  name: string
  flag_emoji: string
  played: number
  wins: number
  draws: number
  losses: number
  gf: number
  gc: number
  pts: number
}

function computeStandings(group: GroupWithMatches): TeamStanding[] {
  const map = new Map<number, TeamStanding>()

  for (const match of group.matches) {
    const addTeam = (id: number | null, team: { name: string; flag_emoji: string } | null) => {
      if (id && team && !map.has(id)) {
        map.set(id, { id, ...team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, gc: 0, pts: 0 })
      }
    }
    addTeam(match.home_team_id, match.home_team)
    addTeam(match.away_team_id, match.away_team)
  }

  for (const match of group.matches) {
    if (match.status !== "finished" || match.home_score === null || match.away_score === null) continue
    const home = match.home_team_id ? map.get(match.home_team_id) : null
    const away = match.away_team_id ? map.get(match.away_team_id) : null
    if (!home || !away) continue

    home.played++; away.played++
    home.gf += match.home_score; home.gc += match.away_score
    away.gf += match.away_score; away.gc += match.home_score

    if (match.home_score > match.away_score) {
      home.wins++; home.pts += 3; away.losses++
    } else if (match.home_score < match.away_score) {
      away.wins++; away.pts += 3; home.losses++
    } else {
      home.draws++; home.pts += 1; away.draws++; away.pts += 1
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const gd = (b.gf - b.gc) - (a.gf - a.gc)
    if (gd !== 0) return gd
    return b.gf - a.gf
  })
}

function StandingsTable({ standings }: { standings: TeamStanding[] }) {
  return (
    <div className="overflow-x-auto border-b border-border/10" style={{ background: "rgba(0,0,0,0.15)" }}>
      <table className="w-full text-xs min-w-[360px]">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <th className="text-left py-1.5 pl-4 w-6 text-muted-foreground/50 font-medium">#</th>
            <th className="text-left py-1.5 pl-1 text-muted-foreground/50 font-medium">Equipo</th>
            <th className="text-center py-1.5 w-8 text-muted-foreground/50 font-medium">PJ</th>
            <th className="text-center py-1.5 w-8 text-muted-foreground/50 font-medium hidden sm:table-cell">G</th>
            <th className="text-center py-1.5 w-8 text-muted-foreground/50 font-medium hidden sm:table-cell">E</th>
            <th className="text-center py-1.5 w-8 text-muted-foreground/50 font-medium hidden sm:table-cell">P</th>
            <th className="text-center py-1.5 w-8 text-muted-foreground/50 font-medium hidden sm:table-cell">GF</th>
            <th className="text-center py-1.5 w-8 text-muted-foreground/50 font-medium hidden sm:table-cell">GC</th>
            <th className="text-center py-1.5 w-10 text-muted-foreground/50 font-medium">DG</th>
            <th className="text-center py-1.5 w-10 pr-4 text-muted-foreground/50 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const gd = s.gf - s.gc
            const isTop2 = i < 2
            const isThird = i === 2
            return (
              <tr
                key={s.id}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isTop2
                    ? "rgba(52,211,153,0.04)"
                    : isThird
                    ? "rgba(99,102,241,0.04)"
                    : undefined,
                }}
              >
                <td className="py-2 pl-4 font-mono text-muted-foreground/40">{i + 1}</td>
                <td className="py-2 pl-1">
                  <div className="flex items-center gap-1.5">
                    {isTop2 && (
                      <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "#34d399" }} />
                    )}
                    {isThird && (
                      <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "#818cf8" }} />
                    )}
                    {!isTop2 && !isThird && <span className="w-1 shrink-0" />}
                    <span className="text-sm shrink-0">{s.flag_emoji}</span>
                    <span className={cn("font-medium truncate max-w-[90px] sm:max-w-none", isTop2 ? "text-foreground" : "text-muted-foreground")}>
                      {s.name}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-center font-mono text-muted-foreground">{s.played}</td>
                <td className="py-2 text-center font-mono text-muted-foreground hidden sm:table-cell">{s.wins}</td>
                <td className="py-2 text-center font-mono text-muted-foreground hidden sm:table-cell">{s.draws}</td>
                <td className="py-2 text-center font-mono text-muted-foreground hidden sm:table-cell">{s.losses}</td>
                <td className="py-2 text-center font-mono text-muted-foreground hidden sm:table-cell">{s.gf}</td>
                <td className="py-2 text-center font-mono text-muted-foreground hidden sm:table-cell">{s.gc}</td>
                <td className={cn("py-2 text-center font-mono", gd > 0 ? "text-emerald-400" : gd < 0 ? "text-red-400" : "text-muted-foreground")}>
                  {gd > 0 ? "+" : ""}{gd}
                </td>
                <td className="py-2 pr-4 text-center font-mono font-black text-base"
                  style={{ color: isTop2 ? "#fecc02" : isThird ? "#a5b4fc" : undefined }}>
                  {s.pts}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const ROUND_LABELS: Record<RoundType, string> = {
  group: "Fase de Grupos",
  round_of_32: "🏟️ Ronda de 32",
  round_of_16: "⚔️ Octavos de Final",
  quarter_final: "🔥 Cuartos de Final",
  semi_final: "🌟 Semifinales",
  third_place: "🥉 Tercer Lugar",
  final: "🏆 Final",
}

const KNOCKOUT_ORDER: RoundType[] = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"]

function MatchRow({
  match,
  flashMatchId,
}: {
  match: MatchWithTeams
  flashMatchId: number | null
}) {
  const isFinished = match.status === "finished"
  const isFlashing = match.id === flashMatchId
  const date = new Date(match.scheduled_at)

  return (
    <div
      className={cn(
        "px-4 py-3 transition-colors duration-700",
        isFinished && "bg-emerald-500/5",
        isFlashing && "bg-emerald-500/20",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
          <span className={cn("text-sm font-medium truncate text-right", match.home_team ? "text-foreground" : "text-muted-foreground italic")}>
            {match.home_team?.name ?? match.home_slot ?? "TBD"}
          </span>
          <span className="text-base shrink-0">{match.home_team?.flag_emoji ?? "🏳️"}</span>
        </div>

        <div className="shrink-0 w-20 text-center">
          {isFinished ? (
            <span
              className="text-xl font-black font-mono text-foreground"
              style={isFlashing ? { animation: "scoreFlash 0.6s ease-out", color: "#34d399" } : undefined}
            >
              {match.home_score}—{match.away_score}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50 font-mono">vs</span>
          )}
        </div>

        <div className="flex-1 flex items-center gap-1 min-w-0">
          <span className="text-base shrink-0">{match.away_team?.flag_emoji ?? "🏳️"}</span>
          <span className={cn("text-sm font-medium truncate", match.away_team ? "text-foreground" : "text-muted-foreground italic")}>
            {match.away_team?.name ?? match.away_slot ?? "TBD"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] text-muted-foreground font-mono">
          {date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
          {" · "}
          {date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
          isFinished
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-foreground/5 text-muted-foreground/60",
          isFlashing && "bg-emerald-500/30 text-emerald-300",
        )}>
          {isFlashing ? "¡Nuevo! 🎉" : isFinished ? "Finalizado" : "Por jugar"}
        </span>
      </div>
    </div>
  )
}

export function MatchesRealtime({
  initialGroups,
  initialKnockouts,
}: {
  initialGroups: GroupWithMatches[]
  initialKnockouts: MatchWithTeams[]
}) {
  const [groups, setGroups] = useState(initialGroups)
  const [knockouts, setKnockouts] = useState(initialKnockouts)
  const [connected, setConnected] = useState(false)
  const [flashMatchId, setFlashMatchId] = useState<number | null>(null)
  const [view, setView] = useState<"group" | "date">("group")

  useEffect(() => {
    const supabase = createClient()

    async function refetch(updatedId?: number) {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji)")
        .order("match_number")

      if (data) {
        const all = data as MatchWithTeams[]
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            matches: all.filter((m) => m.group_id === g.id),
          })),
        )
        setKnockouts(all.filter((m) => m.round !== "group"))
        if (updatedId) {
          setFlashMatchId(updatedId)
          setTimeout(() => setFlashMatchId(null), 3000)
        }
      }
    }

    const channel = supabase
      .channel("matches-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => refetch((payload.new as Match).id),
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"))

    return () => { supabase.removeChannel(channel) }
  }, [])

  const allGroupMatches = groups.flatMap((g) => g.matches)
  const allMatches = [...allGroupMatches, ...knockouts]
  const finished = allMatches.filter((m) => m.status === "finished").length
  const total = allMatches.length

  // Vista por fecha: agrupar todos los partidos por día
  const byDate: Record<string, MatchWithTeams[]> = {}
  if (view === "date") {
    for (const m of allMatches) {
      const day = new Date(m.scheduled_at).toLocaleDateString("es-MX", {
        weekday: "long", day: "numeric", month: "long",
      })
      if (!byDate[day]) byDate[day] = []
      byDate[day].push(m)
    }
    for (const day of Object.keys(byDate)) {
      byDate[day].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">⚽ PARTIDOS</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={cn(
              "w-2 h-2 rounded-full transition-colors duration-500",
              connected ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40",
            )} />
            <p className="text-muted-foreground text-sm">
              {connected ? "En tiempo real" : "Conectando..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground font-mono">
            <span className="text-emerald-400 font-bold">{finished}</span>/{total}
          </div>
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border/20 text-xs">
            <button
              onClick={() => setView("group")}
              className={cn(
                "px-3 py-1.5 font-medium transition-colors",
                view === "group" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              Grupo
            </button>
            <button
              onClick={() => setView("date")}
              className={cn(
                "px-3 py-1.5 font-medium transition-colors border-l border-border/20",
                view === "date" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              Fecha
            </button>
          </div>
        </div>
      </div>

      {/* Vista por fecha */}
      {view === "date" && (
        <div className="space-y-3">
          {Object.entries(byDate).map(([day, dayMatches]) => (
            <details key={day} open className="rounded-xl border border-border/20 overflow-hidden">
              <summary
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none list-none capitalize"
                style={{ background: "rgba(30,41,59,0.3)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <span className="text-sm font-bold text-foreground">{day}</span>
                <span className="text-xs text-muted-foreground font-mono">{dayMatches.length} partidos</span>
              </summary>
              <div className="divide-y divide-border/10">
                {dayMatches.map((match) => (
                  <MatchRow key={match.id} match={match} flashMatchId={flashMatchId} />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Vista por grupo/ronda */}
      {view === "group" && <div className="space-y-3">
        {/* Group stage */}
        {groups.map((group) => {
          const groupFinished = group.matches.filter((m) => m.status === "finished").length
          const standings = computeStandings(group)
          const hasResults = groupFinished > 0
          return (
            <details key={group.id} open className="rounded-xl border border-border/20 overflow-hidden">
              <summary
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none list-none"
                style={{ background: "rgba(30,41,59,0.3)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-foreground/30">GRUPO</span>
                  <span className="text-2xl font-black text-foreground">{group.name}</span>
                  {hasResults && (
                    <div className="flex -space-x-1 ml-1">
                      {standings.slice(0, 2).map((s) => (
                        <span key={s.id} className="text-base" title={s.name}>{s.flag_emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "font-mono font-bold text-xs",
                    groupFinished === 6 ? "text-emerald-400" : "text-muted-foreground",
                  )}>
                    {groupFinished}/6
                  </span>
                  <span className="text-muted-foreground text-xs">▾</span>
                </div>
              </summary>
              {hasResults && <StandingsTable standings={standings} />}
              <div className="divide-y divide-border/10">
                {group.matches.map((match) => (
                  <MatchRow key={match.id} match={match} flashMatchId={flashMatchId} />
                ))}
              </div>
            </details>
          )
        })}

        {/* Knockout rounds — only shown when matches exist for that round */}
        {KNOCKOUT_ORDER.map((round) => {
          const roundMatches = knockouts.filter((m) => m.round === round)
          if (roundMatches.length === 0) return null
          const roundFinished = roundMatches.filter((m) => m.status === "finished").length
          return (
            <details key={round} open className="rounded-xl border border-border/20 overflow-hidden">
              <summary
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none list-none"
                style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.15)" }}
              >
                <span className="font-bold text-foreground">{ROUND_LABELS[round]}</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "font-mono font-bold text-xs",
                    roundFinished === roundMatches.length ? "text-emerald-400" : "text-muted-foreground",
                  )}>
                    {roundFinished}/{roundMatches.length}
                  </span>
                  <span className="text-muted-foreground text-xs">▾</span>
                </div>
              </summary>
              <div className="divide-y divide-border/10">
                {roundMatches.map((match) => (
                  <MatchRow key={match.id} match={match} flashMatchId={flashMatchId} />
                ))}
              </div>
            </details>
          )
        })}
      </div>}
    </div>
  )
}
