import { createClient } from "@/lib/supabase/server"
import { setBonusResult } from "@/lib/actions/admin"
import { AdminMatchRow } from "@/components/admin-match-row"
import type { Match, Group } from "@/lib/types"

export const dynamic = "force-dynamic"

type MatchWithTeams = Match & {
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
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
        <h1 className="text-2xl font-bold text-foreground">⚙️ Administrar Resultados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Al guardar un resultado los puntos se recalculan automáticamente.{" "}
          <span className="text-emerald-400 font-mono font-bold">{finished}/72</span> partidos finalizados.
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

      {/* Match results by group */}
      {groupsWithMatches.map((group) => (
        <div key={group.id}>
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
  )
}
