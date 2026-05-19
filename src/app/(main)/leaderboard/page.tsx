import { createClient } from "@/lib/supabase/server"
import type { LeaderboardEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const revalidate = 30

const MEDALS = ["🥇", "🥈", "🥉"]

function getMedalOrRank(rank: number) {
  if (rank <= 3) return MEDALS[rank - 1]
  return rank
}

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()

  const leaderboard = (entries ?? []) as LeaderboardEntry[]
  const maxPoints = leaderboard[0]?.total_points ?? 1

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🏆 Tabla de Posiciones</h1>
        <p className="text-slate-400 text-sm mt-1">
          Actualiza cada vez que el admin ingresa un resultado
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl mb-4">📊</div>
          <p>Aún no hay resultados. El torneo empieza el 11 de junio.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const rank = idx + 1
            const isMe = entry.user_id === user?.id
            const pct = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0

            return (
              <div key={entry.user_id}
                className={cn(
                  "rounded-xl border px-5 py-4 flex items-center gap-4 transition-colors",
                  isMe
                    ? "border-red-800/60 bg-red-950/30"
                    : "border-white/10 bg-white/[0.02]",
                  rank <= 3 && "border-yellow-900/40 bg-yellow-950/10",
                )}>
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {typeof getMedalOrRank(rank) === "string" ? (
                    <span className="text-2xl">{getMedalOrRank(rank)}</span>
                  ) : (
                    <span className="text-xl font-bold text-slate-500">
                      {getMedalOrRank(rank)}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
                  isMe
                    ? "bg-gradient-to-br from-red-700 to-red-900"
                    : "bg-gradient-to-br from-slate-700 to-slate-900",
                )}>
                  {entry.display_name.charAt(0).toUpperCase()}
                </div>

                {/* Name + progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-semibold truncate",
                      isMe ? "text-white" : "text-slate-200",
                    )}>
                      {entry.display_name}
                      {isMe && <span className="text-xs text-red-400 ml-1">(tú)</span>}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full rounded-full"
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
                <div className="flex items-center gap-6 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-slate-500 font-medium">Exactos</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono text-center">
                      {entry.exact_scores}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs text-slate-500 font-medium">Ganadores</div>
                    <div className="text-sm font-bold text-sky-400 font-mono text-center">
                      {entry.winner_results}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Puntos</div>
                    <div className={cn(
                      "text-xl font-black font-mono",
                      rank === 1 ? "text-yellow-300" : isMe ? "text-white" : "text-slate-200",
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

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>🎯 Exactos = marcador exacto (+3 pts)</span>
        <span>✅ Correctos = resultado 1X2 (+1 pt)</span>
        <span>🏆 +Bonus campeón/3er lugar</span>
      </div>
    </div>
  )
}
