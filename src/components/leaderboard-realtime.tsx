"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/lib/types"

const MEDALS = ["🥇", "🥈", "🥉"]

function getMedalOrRank(rank: number) {
  if (rank <= 3) return MEDALS[rank - 1]
  return rank
}

export function LeaderboardRealtime({
  initialEntries,
  userId,
}: {
  initialEntries: LeaderboardEntry[]
  userId: string
}) {
  const [entries, setEntries] = useState(initialEntries)
  const [connected, setConnected] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function refetch() {
      const { data } = await supabase
        .from("leaderboard")
        .select("*")
        .order("total_points", { ascending: false })
      if (data) {
        setEntries(data as LeaderboardEntry[])
        setFlash(true)
        setTimeout(() => setFlash(false), 1500)
      }
    }

    const channel = supabase
      .channel("leaderboard-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, refetch)
      .subscribe((status) => setConnected(status === "SUBSCRIBED"))

    return () => { supabase.removeChannel(channel) }
  }, [])

  const maxPoints = entries[0]?.total_points ?? 1

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🏆 Tabla de Posiciones</h1>
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
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">📊</div>
          <p>Aún no hay resultados. El torneo empieza el 11 de junio.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1
            const isMe = entry.user_id === userId
            const pct = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0

            return (
              <div
                key={entry.user_id}
                className={cn(
                  "rounded-xl border px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 transition-all duration-500 hover:scale-[1.01] hover:shadow-lg cursor-default",
                  isMe ? "border-primary/40 bg-primary/10" : "border-border/20 bg-foreground/[0.02]",
                  rank <= 3 && "border-yellow-500/20 bg-yellow-500/5",
                  flash && "ring-1 ring-emerald-500/30",
                )}
              >
                {/* Rank */}
                <div className="w-7 sm:w-10 text-center shrink-0">
                  {typeof getMedalOrRank(rank) === "string" ? (
                    <span className="text-xl sm:text-2xl">{getMedalOrRank(rank)}</span>
                  ) : (
                    <span className="text-base sm:text-xl font-bold text-muted-foreground">{getMedalOrRank(rank)}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{
                    background: isMe
                      ? "linear-gradient(135deg, #8b1a2f, #c0392b)"
                      : "linear-gradient(135deg, #374151, #1f2937)",
                  }}
                >
                  {entry.display_name.charAt(0).toUpperCase()}
                </div>

                {/* Name + progress */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-foreground text-sm sm:text-base">
                    {entry.display_name}
                    {isMe && <span className="text-xs text-primary ml-1">(tú)</span>}
                  </p>
                  <div className="mt-1.5 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        background: rank === 1
                          ? "linear-gradient(90deg,#fecc02,#f59e0b)"
                          : "linear-gradient(90deg,#8b1a2f,#c0392b)",
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-muted-foreground font-medium">Exactos</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono text-center">
                      {entry.exact_scores}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs text-muted-foreground font-medium">Ganadores</div>
                    <div className="text-sm font-bold text-sky-400 font-mono text-center">
                      {entry.winner_results}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Pts</div>
                    <div className={cn(
                      "text-lg sm:text-xl font-black font-mono transition-all duration-500",
                      rank === 1 ? "text-yellow-300" : isMe ? "text-foreground" : "text-foreground/80",
                    )}>
                      {entry.total_points}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>🎯 Exactos (+3 pts)</span>
        <span>✅ Ganadores (+2 pts)</span>
        <span>🤝 Empates (+1 pt)</span>
        <span>🏆 Bonus campeón/3er lugar</span>
      </div>
    </div>
  )
}
