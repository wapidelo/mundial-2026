import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import type { Match, Group } from "@/lib/types"

export const dynamic = "force-dynamic"

type MatchWithTeams = Match & {
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
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

  const groupsWithMatches: GroupWithMatches[] = (groups ?? []).map((g) => ({
    ...g,
    matches: (matches ?? []).filter((m) => m.group_id === g.id) as MatchWithTeams[],
  }))

  const finished = (matches ?? []).filter((m) => m.status === "finished").length
  const total = (matches ?? []).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">⚽ Partidos</h1>
          <p className="text-slate-400 text-sm mt-1">
            Resultados de la fase de grupos
          </p>
        </div>
        <div className="text-sm text-slate-400 font-mono">
          <span className="text-emerald-400 font-bold">{finished}</span>/{total} finalizados
        </div>
      </div>

      <div className="space-y-4">
        {groupsWithMatches.map((group) => {
          const groupFinished = group.matches.filter((m) => m.status === "finished").length
          return (
            <details key={group.id} open className="rounded-xl border border-white/10 overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-3 cursor-pointer select-none list-none"
                style={{ background: "rgba(30,41,59,0.5)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white/30">GRUPO</span>
                  <span className="text-3xl font-black text-white">{group.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn("font-mono font-bold",
                    groupFinished === 6 ? "text-emerald-400" : "text-slate-400")}>
                    {groupFinished}/6
                  </span>
                  <span className="text-slate-600">▾</span>
                </div>
              </summary>

              <div className="divide-y divide-white/5">
                {group.matches.map((match) => {
                  const isFinished = match.status === "finished"
                  const date = new Date(match.scheduled_at)
                  return (
                    <div key={match.id} className={cn(
                      "flex items-center gap-3 px-5 py-4",
                      isFinished ? "bg-emerald-950/10" : "",
                    )}>
                      {/* Date */}
                      <div className="text-xs text-slate-500 w-20 shrink-0 text-center">
                        <div>{date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</div>
                        <div className="font-mono">{date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>

                      {/* Home */}
                      <div className="flex-1 text-right">
                        <span className="text-base mr-1">{match.home_team?.flag_emoji}</span>
                        <span className="text-sm font-medium text-white">{match.home_team?.name}</span>
                      </div>

                      {/* Score */}
                      <div className="shrink-0 w-24 text-center">
                        {isFinished ? (
                          <span className="text-2xl font-black font-mono text-white">
                            {match.home_score} — {match.away_score}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-600 font-mono">vs</span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-white">{match.away_team?.name}</span>
                        <span className="text-base ml-1">{match.away_team?.flag_emoji}</span>
                      </div>

                      {/* Status pill */}
                      <div className="w-24 shrink-0 text-right">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          isFinished
                            ? "bg-emerald-900/40 text-emerald-400"
                            : "bg-slate-800 text-slate-500",
                        )}>
                          {isFinished ? "Finalizado" : "Por jugar"}
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
