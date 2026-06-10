"use client"

import { useEffect, useState } from "react"

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1_000)
  return { days, hours, minutes, seconds, totalHours: diff / 3_600_000 }
}

export function DeadlineBanner({ tournamentStart }: { tournamentStart: string }) {
  const target = new Date(tournamentStart)
  const [left, setLeft] = useState(() => getTimeLeft(target))

  useEffect(() => {
    const id = setInterval(() => setLeft(getTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!left) return null

  const urgent = left.totalHours < 48
  const warning = left.totalHours < 168 // < 7 days

  const bg = urgent
    ? "rgba(239,68,68,0.08)"
    : warning
      ? "rgba(245,158,11,0.07)"
      : "rgba(99,102,241,0.07)"
  const border = urgent
    ? "rgba(239,68,68,0.25)"
    : warning
      ? "rgba(245,158,11,0.25)"
      : "rgba(99,102,241,0.2)"
  const accent = urgent ? "#f87171" : warning ? "#fbbf24" : "#a5b4fc"
  const icon = urgent ? "🚨" : warning ? "⏰" : "📅"

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <div
      className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3 flex-wrap"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span className="text-lg shrink-0">{icon}</span>
      <p className="text-sm flex-1 min-w-0" style={{ color: accent }}>
        <span className="font-semibold">Las predicciones cierran el 11 de junio</span>
        {urgent && <span className="ml-1 font-bold"> — ¡últimas horas!</span>}
      </p>
      <div className="flex items-center gap-1 shrink-0 font-mono font-bold text-sm" style={{ color: accent }}>
        {left.days > 0 && (
          <>
            <span className="tabular-nums">{left.days}d</span>
            <span className="opacity-40 mx-0.5">·</span>
          </>
        )}
        <span className="tabular-nums">{pad(left.hours)}h</span>
        <span className="opacity-40 mx-0.5">:</span>
        <span className="tabular-nums">{pad(left.minutes)}m</span>
        <span className="opacity-40 mx-0.5">:</span>
        <span className="tabular-nums">{pad(left.seconds)}s</span>
      </div>
    </div>
  )
}
