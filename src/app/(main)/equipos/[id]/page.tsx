import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const CONF_COLORS: Record<string, string> = {
  UEFA:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CAF:      "bg-amber-500/20 text-amber-300 border-amber-500/30",
  CONCACAF: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CONMEBOL: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  AFC:      "bg-red-500/20 text-red-300 border-red-500/30",
  OFC:      "bg-purple-500/20 text-purple-300 border-purple-500/30",
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const teamId = parseInt(id)
  if (isNaN(teamId)) notFound()

  const supabase = await createClient()

  const [{ data: team }, { data: matches }] = await Promise.all([
    supabase
      .from("teams")
      .select("*, groups(name)")
      .eq("id", teamId)
      .single(),
    supabase
      .from("matches")
      .select("*, home_team:teams!home_team_id(id,name,flag_emoji), away_team:teams!away_team_id(id,name,flag_emoji)")
      .eq("round", "group")
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order("match_number"),
  ])

  if (!team) notFound()

  // Rivales: otros equipos del mismo grupo
  const { data: groupTeams } = await supabase
    .from("teams")
    .select("id, name, flag_emoji")
    .eq("group_id", team.group_id)
    .neq("id", teamId)

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/equipos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        ← Todos los equipos
      </Link>

      {/* Header del equipo */}
      <div
        className="rounded-2xl border border-border/20 p-6 mb-6 flex items-center gap-5"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <span className="text-7xl">{team.flag_emoji}</span>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{team.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border",
              CONF_COLORS[team.confederation] ?? "bg-foreground/10 text-muted-foreground border-border/20",
            )}>
              {team.confederation}
            </span>
            <span className="text-sm text-muted-foreground">
              Grupo <span className="font-bold text-foreground">{team.groups?.name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Partidos del grupo */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-muted-foreground/60 tracking-widest mb-3 uppercase">Partidos de Grupo</h2>
        <div className="rounded-xl border border-border/20 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          {(matches ?? []).map((match, i) => {
            const home = match.home_team as { id: number; name: string; flag_emoji: string } | null
            const away = match.away_team as { id: number; name: string; flag_emoji: string } | null
            const isHome = match.home_team_id === teamId
            const rival = isHome ? away : home
            const date = new Date(match.scheduled_at)
            const isFinished = match.status === "finished"

            return (
              <div
                key={match.id}
                className={cn(
                  "px-5 py-4",
                  i > 0 && "border-t border-border/10",
                  isFinished && "bg-emerald-500/5",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground/40 shrink-0">#{match.match_number}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{home?.flag_emoji}</span>
                      <span className={cn("text-sm font-medium", match.home_team_id === teamId ? "text-foreground" : "text-muted-foreground")}>
                        {home?.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground/40 text-sm shrink-0">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{away?.flag_emoji}</span>
                      <span className={cn("text-sm font-medium", match.away_team_id === teamId ? "text-foreground" : "text-muted-foreground")}>
                        {away?.name}
                      </span>
                    </div>
                  </div>
                  {isFinished && (
                    <span className="text-lg font-black font-mono text-emerald-400 shrink-0">
                      {match.home_score}–{match.away_score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                    {" · "}
                    {date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} ET
                  </span>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    isFinished ? "bg-emerald-500/15 text-emerald-400" : "bg-foreground/5 text-muted-foreground/50",
                  )}>
                    {isFinished ? "Finalizado" : "Por jugar"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rivales del grupo */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground/60 tracking-widest mb-3 uppercase">Rivales en Grupo {team.groups?.name}</h2>
        <div className="flex gap-3 flex-wrap">
          {(groupTeams ?? []).map((rival) => (
            <Link
              key={rival.id}
              href={`/equipos/${rival.id}`}
              className="flex items-center gap-2 rounded-xl px-4 py-3 border border-border/20 hover:border-border/50 transition-colors"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <span className="text-2xl">{rival.flag_emoji}</span>
              <span className="text-sm font-medium">{rival.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
