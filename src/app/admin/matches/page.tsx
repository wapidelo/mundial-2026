import { createClient } from "@/lib/supabase/server"
import { setMatchResult, setBonusResult } from "@/lib/actions/admin"
import { cn } from "@/lib/utils"
import type { Match, Group } from "@/lib/types"

export const dynamic = "force-dynamic"

type MatchWithTeams = Match & {
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
}

function AdminMatchRow({ match }: { match: MatchWithTeams }) {
  const isFinished = match.status === "finished"

  return (
    <div className={cn(
      "rounded-lg border px-4 py-3",
      isFinished ? "border-emerald-900/40 bg-emerald-950/10" : "border-white/10 bg-white/[0.02]"
    )}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Match info */}
        <div className="text-xs text-slate-500 w-14 shrink-0 text-center">
          <div>#{match.match_number}</div>
          <div>{new Date(match.scheduled_at).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}</div>
        </div>

        {/* Teams */}
        <div className="flex-1 flex items-center gap-2 text-sm min-w-0">
          <span>{match.home_team?.flag_emoji}</span>
          <span className="font-medium text-white truncate">{match.home_team?.name}</span>
          <span className="text-slate-500 shrink-0">vs</span>
          <span className="font-medium text-white truncate">{match.away_team?.name}</span>
          <span>{match.away_team?.flag_emoji}</span>
        </div>

        {/* Current score */}
        {isFinished && (
          <div className="font-mono font-bold text-emerald-400 text-lg shrink-0">
            {match.home_score} — {match.away_score}
          </div>
        )}

        {/* Result form */}
        <form action={setMatchResult} className="flex items-center gap-2 shrink-0">
          <input type="hidden" name="match_id" value={match.id} />
          <input
            type="number"
            name="home_score"
            defaultValue={match.home_score ?? ""}
            min={0}
            max={99}
            placeholder="0"
            className="w-12 text-center font-mono font-bold text-white bg-white/5 border border-white/20 rounded-lg p-1.5 text-lg focus:outline-none focus:border-yellow-600"
          />
          <span className="text-slate-600 font-bold">–</span>
          <input
            type="number"
            name="away_score"
            defaultValue={match.away_score ?? ""}
            min={0}
            max={99}
            placeholder="0"
            className="w-12 text-center font-mono font-bold text-white bg-white/5 border border-white/20 rounded-lg p-1.5 text-lg focus:outline-none focus:border-yellow-600"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: isFinished ? "rgba(16,185,129,0.2)" : "rgba(139,26,47,0.4)",
              color: isFinished ? "#10b981" : "#f8fafc",
              border: isFinished ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(139,26,47,0.5)",
            }}
          >
            {isFinished ? "✓ Actualizar" : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  )
}

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

  const finished = (matches ?? []).filter((m) => m.status === "finished").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">⚙️ Administrar Resultados</h1>
        <p className="text-slate-400 text-sm mt-1">
          Al guardar un resultado, los puntos se recalculan automáticamente.{" "}
          <span className="text-emerald-400 font-mono font-bold">{finished}/72</span> partidos finalizados.
        </p>
      </div>

      {/* Bonus results */}
      <div className="rounded-xl border border-yellow-900/40 p-5"
        style={{ background: "rgba(254,204,2,0.04)" }}>
        <h2 className="font-bold text-white mb-4">🏆 Resultados Bonus</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["champion", "third_place"] as const).map((type) => (
            <form key={type} action={setBonusResult}
              className="flex items-end gap-3">
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
                className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
                style={{
                  background: "rgba(254,204,2,0.2)",
                  color: "#fecc02",
                  border: "1px solid rgba(254,204,2,0.3)",
                }}
              >
                Guardar
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Match results by group */}
      {groupsWithMatches.map((group) => (
        <div key={group.id}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-black text-slate-500">GRUPO</span>
            <span className="text-2xl font-black text-white">{group.name}</span>
            <span className="text-sm text-slate-500 font-mono ml-2">
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
  )
}
