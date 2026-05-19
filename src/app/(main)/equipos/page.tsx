"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Team = {
  id: number
  name: string
  flag_emoji: string
  confederation: string
  groups: { name: string } | null
}

const CONF_ORDER = ["UEFA", "CAF", "CONCACAF", "CONMEBOL", "AFC", "OFC"]
const CONF_COLORS: Record<string, string> = {
  UEFA:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CAF:      "bg-amber-500/20 text-amber-300 border-amber-500/30",
  CONCACAF: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CONMEBOL: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  AFC:      "bg-red-500/20 text-red-300 border-red-500/30",
  OFC:      "bg-purple-500/20 text-purple-300 border-purple-500/30",
}

export default function EquiposPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filter, setFilter] = useState<string>("TODOS")

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("teams")
      .select("id, name, flag_emoji, confederation, groups(name)")
      .order("name")
      .then(({ data }) => setTeams((data ?? []) as unknown as Team[]))
  }, [])

  const confCounts = CONF_ORDER.reduce<Record<string, number>>((acc, c) => {
    acc[c] = teams.filter((t) => t.confederation === c).length
    return acc
  }, {})

  const filtered =
    filter === "TODOS"
      ? teams
      : teams.filter((t) => t.confederation === filter)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">🌍 EQUIPOS</h1>
        <p className="text-muted-foreground text-sm mt-1">Las 48 selecciones clasificadas al Mundial 2026</p>
      </div>

      {/* Filtros de confederación */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("TODOS")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
            filter === "TODOS"
              ? "bg-foreground text-background border-foreground"
              : "bg-foreground/5 text-muted-foreground border-border/20 hover:border-border/40",
          )}
        >
          TODOS · {teams.length}
        </button>
        {CONF_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              filter === c
                ? CONF_COLORS[c] + " border-current"
                : "bg-foreground/5 text-muted-foreground border-border/20 hover:border-border/40",
            )}
          >
            {c} · {confCounts[c] ?? 0}
          </button>
        ))}
      </div>

      {/* Grid de equipos */}
      {teams.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Cargando equipos...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((team) => (
            <Link
              key={team.id}
              href={`/equipos/${team.id}`}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl p-4 border border-border/20 transition-all",
                "hover:border-border/50 hover:bg-foreground/5",
              )}
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <span className="text-4xl">{team.flag_emoji}</span>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground leading-tight">{team.name}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Grupo {team.groups?.name}</p>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                CONF_COLORS[team.confederation] ?? "bg-foreground/10 text-muted-foreground border-border/20",
              )}>
                {team.confederation}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
