"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { setMatchResult } from "@/lib/actions/admin"
import { cn } from "@/lib/utils"
import type { Match } from "@/lib/types"

type MatchWithTeams = Match & {
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
}

export function AdminMatchRow({ match: initialMatch }: { match: MatchWithTeams }) {
  const [match, setMatch] = useState(initialMatch)
  const [isPending, startTransition] = useTransition()
  const isFinished = match.status === "finished"

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const home = Number(fd.get("home_score"))
    const away = Number(fd.get("away_score"))

    startTransition(async () => {
      try {
        await setMatchResult(fd)
        setMatch((prev) => ({ ...prev, home_score: home, away_score: away, status: "finished" }))
        toast.success(`✓ Partido #${match.match_number}: ${home} — ${away} guardado`)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error al guardar")
      }
    })
  }

  return (
    <div className={cn(
      "rounded-lg border px-4 py-3 transition-all duration-300",
      isFinished
        ? "border-emerald-500/20 bg-emerald-500/5"
        : "border-border/20 bg-foreground/[0.02] hover:bg-foreground/[0.04]",
      isPending && "opacity-60 pointer-events-none",
    )}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs text-muted-foreground w-14 shrink-0 text-center">
          <div className="font-mono">#{match.match_number}</div>
          <div>{new Date(match.scheduled_at).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}</div>
        </div>

        <div className="flex-1 flex items-center gap-2 text-sm min-w-0">
          <span>{match.home_team?.flag_emoji}</span>
          <span className="font-medium text-foreground truncate">{match.home_team?.name}</span>
          <span className="text-muted-foreground shrink-0">vs</span>
          <span className="font-medium text-foreground truncate">{match.away_team?.name}</span>
          <span>{match.away_team?.flag_emoji}</span>
        </div>

        {isFinished && (
          <div
            className="font-mono font-bold text-emerald-400 text-lg shrink-0 px-3 py-0.5 rounded-lg"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            {match.home_score} — {match.away_score}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 shrink-0">
          <input type="hidden" name="match_id" value={match.id} />
          <input
            type="number"
            name="home_score"
            defaultValue={match.home_score ?? ""}
            min={0}
            max={99}
            placeholder="0"
            required
            className="w-12 text-center font-mono font-bold text-foreground bg-muted/40 border border-border/30 rounded-lg p-1.5 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
          />
          <span className="text-muted-foreground font-bold">–</span>
          <input
            type="number"
            name="away_score"
            defaultValue={match.away_score ?? ""}
            min={0}
            max={99}
            placeholder="0"
            required
            className="w-12 text-center font-mono font-bold text-foreground bg-muted/40 border border-border/30 rounded-lg p-1.5 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer hover:brightness-110"
            style={isFinished
              ? { background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
              : { background: "rgba(139,26,47,0.5)", color: "#f8fafc", border: "1px solid rgba(139,26,47,0.6)" }
            }
          >
            {isPending ? "⟳" : isFinished ? "✓ Actualizar" : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  )
}
