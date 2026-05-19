import { createClient } from "@/lib/supabase/server"
import { setBonusResult, assignTeamToMatch } from "@/lib/actions/admin"
import { AdminMatchRow } from "@/components/admin-match-row"
import type { Match, Group, RoundType } from "@/lib/types"

export const dynamic = "force-dynamic"

type MatchWithTeams = Match & {
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
  home_slot: string | null
  away_slot: string | null
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

export default async function AdminMatchesPage() {
  const supabase = await createClient()

  const [{ data: groups }, { data: matches }, { data: teams }] = await Promise.all([
    supabase.from("groups").select("*").order("name"),
    supabase
      .from("matches")
      .select("*, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji)")
      .order("match_number"),
    supabase.from("teams").select("id, name, flag_emoji").order("name"),
  ])

  type GroupWithMatches = Group & { matches: MatchWithTeams[] }
  const groupsWithMatches: GroupWithMatches[] = (groups ?? []).map((g) => ({
    ...g,
    matches: (matches ?? []).filter((m: MatchWithTeams) => m.group_id === g.id),
  }))

  const knockoutMatches = (matches ?? []).filter((m: MatchWithTeams) => m.round !== "group")
  const knockoutByRound = KNOCKOUT_ORDER.reduce<Record<string, MatchWithTeams[]>>((acc, round) => {
    acc[round] = knockoutMatches.filter((m: MatchWithTeams) => m.round === round)
    return acc
  }, {})

  const allMatches = matches ?? []
  const finished = allMatches.filter((m) => m.status === "finished").length

  const selectClass = "flex-1 rounded-lg border border-white/10 bg-white/5 text-white px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400 min-w-0"
  const assignBtnClass = "px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all hover:brightness-110"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">⚙️ Administrar Resultados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Al guardar un resultado los puntos se recalculan automáticamente.{" "}
          <span className="text-emerald-400 font-mono font-bold">{finished}/{allMatches.length}</span> partidos finalizados.
        </p>
      </div>

      {/* Bonus results */}
      <div className="rounded-xl border border-yellow-900/40 p-5"
        style={{ background: "rgba(254,204,2,0.04)" }}>
        <h2 className="font-bold text-white mb-4">🏆 Resultados Bonus</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["champion", "third_place"] as const).map((type) => (
            <form key={type} action={setBonusResult} className="flex items-end gap-3">
              <input type="hidden" name="type" value={type} />
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {type === "champion" ? "🥇 Campeón (+5 pts)" : "🥉 Tercer lugar (+3 pts)"}
                </label>
                <select
                  name="team_id"
                  className="w-full rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm"
                >
                  <option value="">— Seleccionar —</option>
                  {(teams ?? []).map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900">
                      {t.flag_emoji} {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-all hover:brightness-110"
                style={{ background: "rgba(254,204,2,0.2)", color: "#fecc02", border: "1px solid rgba(254,204,2,0.3)" }}
              >
                Guardar
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Knockout bracket — assign real teams as groups finish */}
      <div className="rounded-xl border border-indigo-500/20 overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-3"
          style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
          <span className="text-lg">🏟️</span>
          <div>
            <h2 className="font-bold text-white leading-tight">Bracket Eliminatorio</h2>
            <p className="text-xs text-muted-foreground">
              Asigna equipos reales conforme avanzan en el torneo
            </p>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {KNOCKOUT_ORDER.map((round) => {
            const roundMatches = knockoutByRound[round]
            if (!roundMatches || roundMatches.length === 0) return null
            const roundFinished = roundMatches.filter((m) => m.status === "finished").length
            const teamsAssigned = roundMatches.filter(
              (m) => m.home_team_id !== null && m.away_team_id !== null
            ).length

            return (
              <div key={round}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold text-foreground">{ROUND_LABELS[round]}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {teamsAssigned}/{roundMatches.length} asignados ·{" "}
                    {roundFinished}/{roundMatches.length} finalizados
                  </span>
                </div>

                <div className="space-y-2">
                  {roundMatches.map((match) => (
                    <div key={match.id} className="rounded-xl border border-border/20 overflow-hidden">
                      {/* Team assignment row */}
                      <div className="px-3 py-2 flex flex-wrap items-center gap-2"
                        style={{ background: "rgba(99,102,241,0.05)", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          #{match.match_number} ·{" "}
                          {new Date(match.scheduled_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                        </span>

                        {/* Home slot assignment */}
                        <form action={assignTeamToMatch} className="flex items-center gap-1 flex-1 min-w-[200px]">
                          <input type="hidden" name="match_id" value={match.id} />
                          <input type="hidden" name="side" value="home" />
                          <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                            {match.home_team ? (
                              <span className="text-emerald-400">{match.home_team.flag_emoji}</span>
                            ) : (
                              <span className="italic">{match.home_slot ?? "Local"}</span>
                            )}
                          </span>
                          <select name="team_id" className={selectClass}>
                            <option value="">
                              {match.home_team ? `${match.home_team.flag_emoji} ${match.home_team.name}` : "— Asignar local —"}
                            </option>
                            {(teams ?? []).map((t) => (
                              <option key={t.id} value={t.id} className="bg-slate-900">
                                {t.flag_emoji} {t.name}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className={assignBtnClass}
                            style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
                            ✓
                          </button>
                        </form>

                        <span className="text-muted-foreground text-xs shrink-0">vs</span>

                        {/* Away slot assignment */}
                        <form action={assignTeamToMatch} className="flex items-center gap-1 flex-1 min-w-[200px]">
                          <input type="hidden" name="match_id" value={match.id} />
                          <input type="hidden" name="side" value="away" />
                          <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                            {match.away_team ? (
                              <span className="text-emerald-400">{match.away_team.flag_emoji}</span>
                            ) : (
                              <span className="italic">{match.away_slot ?? "Visit."}</span>
                            )}
                          </span>
                          <select name="team_id" className={selectClass}>
                            <option value="">
                              {match.away_team ? `${match.away_team.flag_emoji} ${match.away_team.name}` : "— Asignar visitante —"}
                            </option>
                            {(teams ?? []).map((t) => (
                              <option key={t.id} value={t.id} className="bg-slate-900">
                                {t.flag_emoji} {t.name}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className={assignBtnClass}
                            style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
                            ✓
                          </button>
                        </form>
                      </div>

                      {/* Result entry */}
                      <div className="px-2 py-1.5">
                        <AdminMatchRow match={match} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Group stage matches */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">⚽ Fase de Grupos</h2>
        {groupsWithMatches.map((group) => (
          <div key={group.id} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-black text-foreground/30">GRUPO</span>
              <span className="text-2xl font-black text-foreground">{group.name}</span>
              <span className="text-sm text-muted-foreground font-mono ml-2">
                {group.matches.filter((m) => m.status === "finished").length}/6
              </span>
            </div>
            <div className="space-y-2">
              {group.matches.map((match) => (
                <AdminMatchRow key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
