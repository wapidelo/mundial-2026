"use client"

import { useEffect, useState } from "react"
import { MatchRow, type MatchWithTeams, type LiveData } from "@/components/matches-realtime"

export function TodayMatchesButton({
  matches,
  predictedMatchIds = [],
}: {
  matches: MatchWithTeams[]
  predictedMatchIds?: number[]
}) {
  const [open, setOpen] = useState(false)
  const [todayMatches, setTodayMatches] = useState<MatchWithTeams[]>([])
  const [liveScores, setLiveScores] = useState<Map<string, LiveData>>(new Map())

  useEffect(() => {
    const now = new Date()
    setTodayMatches(
      matches
        .filter((m) => {
          const d = new Date(m.scheduled_at)
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
          )
        })
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    )
  }, [matches])

  useEffect(() => {
    if (!open) return
    async function fetchLive() {
      try {
        const res = await fetch("/api/live-scores")
        if (!res.ok) return
        const data = await res.json()
        const map = new Map<string, LiveData>()
        for (const m of data.matches) {
          map.set(`${m.homeTeam}|${m.awayTeam}`, m)
        }
        setLiveScores(map)
      } catch {}
    }
    fetchLive()
    const timer = setInterval(fetchLive, 30_000)
    return () => clearInterval(timer)
  }, [open])

  if (todayMatches.length === 0) return null

  const now = new Date()
  const pendingCount = todayMatches.filter(
    (m) => m.status !== "finished" && new Date(m.scheduled_at) > now && !predictedMatchIds.includes(m.id),
  ).length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg text-base font-bold transition-all hover:brightness-110 cursor-pointer"
        style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
      >
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
        <span>
          Juegos de hoy ({todayMatches.length})
          {pendingCount > 0 && (
            <span
              className="ml-2 px-1.5 py-0.5 rounded-md text-xs font-bold"
              style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)" }}
            >
              {pendingCount} sin predecir
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-card rounded-2xl border border-border/30 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-border/20"
              style={{ background: "rgba(239,68,68,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <p className="font-bold text-foreground">
                  Juegos de hoy · {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-foreground/5"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-border/10 overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {todayMatches.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  flashMatchId={null}
                  liveData={
                    match.home_team && match.away_team
                      ? liveScores.get(`${match.home_team.name}|${match.away_team.name}`)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
