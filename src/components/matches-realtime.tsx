"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Match, Group } from "@/lib/types"

type MatchWithTeams = Match & {
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
}

type GroupWithMatches = Group & { matches: MatchWithTeams[] }

export function MatchesRealtime({
  initialGroups,
}: {
  initialGroups: GroupWithMatches[]
}) {
  const [groups, setGroups] = useState(initialGroups)
  const [connected, setConnected] = useState(false)
  const [flashMatchId, setFlashMatchId] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function refetch(updatedId?: number) {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji)")
        .order("match_number")

      if (data) {
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            matches: (data as MatchWithTeams[]).filter((m) => m.group_id === g.id),
          })),
        )
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

  const allMatches = groups.flatMap((g) => g.matches)
  const finished = allMatches.filter((m) => m.status === "finished").length
  const total = allMatches.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">⚽ Partidos</h1>
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
        <div className="text-sm text-muted-foreground font-mono">
          <span className="text-emerald-400 font-bold">{finished}</span>/{total} finalizados
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const groupFinished = group.matches.filter((m) => m.status === "finished").length
          return (
            <details key={group.id} open className="rounded-xl border border-border/20 overflow-hidden">
              <summary
                className="flex items-center justify-between px-5 py-3 cursor-pointer select-none list-none"
                style={{ background: "rgba(30,41,59,0.3)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-foreground/30">GRUPO</span>
                  <span className="text-3xl font-black text-foreground">{group.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "font-mono font-bold",
                    groupFinished === 6 ? "text-emerald-400" : "text-muted-foreground",
                  )}>
                    {groupFinished}/6
                  </span>
                  <span className="text-muted-foreground">▾</span>
                </div>
              </summary>

              <div className="divide-y divide-border/10">
                {group.matches.map((match) => {
                  const isFinished = match.status === "finished"
                  const isFlashing = match.id === flashMatchId
                  const date = new Date(match.scheduled_at)

                  return (
                    <div
                      key={match.id}
                      className={cn(
                        "flex items-center gap-3 px-5 py-4 transition-colors duration-700",
                        isFinished && "bg-emerald-500/5",
                        isFlashing && "bg-emerald-500/20",
                      )}
                    >
                      {/* Date */}
                      <div className="text-xs text-muted-foreground w-20 shrink-0 text-center">
                        <div>{date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</div>
                        <div className="font-mono">{date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>

                      {/* Home */}
                      <div className="flex-1 text-right">
                        <span className="text-base mr-1">{match.home_team?.flag_emoji}</span>
                        <span className="text-sm font-medium text-foreground">{match.home_team?.name}</span>
                      </div>

                      {/* Score */}
                      <div className="shrink-0 w-24 text-center">
                        {isFinished ? (
                          <span
                            className="text-2xl font-black font-mono text-foreground"
                            style={isFlashing ? { animation: "scoreFlash 0.6s ease-out", color: "#34d399" } : undefined}
                          >
                            {match.home_score} — {match.away_score}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40 font-mono">vs</span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-foreground">{match.away_team?.name}</span>
                        <span className="text-base ml-1">{match.away_team?.flag_emoji}</span>
                      </div>

                      {/* Status */}
                      <div className="w-24 shrink-0 text-right">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          isFinished
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-foreground/5 text-muted-foreground",
                          isFlashing && "bg-emerald-500/30 text-emerald-300",
                        )}>
                          {isFlashing ? "¡Nuevo! 🎉" : isFinished ? "Finalizado" : "Por jugar"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
