"use client"

import { useEffect, useState } from "react"

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

function getTimeLeft(target: string): TimeLeft {
  const diff = Math.max(0, new Date(target).getTime() - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export function Countdown({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTime(getTimeLeft(targetDate))
    const id = setInterval(() => setTime(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!time) return <div className="h-24" />

  const started = new Date(targetDate) <= new Date()
  if (started) {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.35)" }}>
        🟢 ¡El Mundial está en curso!
      </div>
    )
  }

  const units = [
    { label: "DÍAS", value: time.days },
    { label: "HRS", value: time.hours },
    { label: "MIN", value: time.minutes },
    { label: "SEG", value: time.seconds },
  ]

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Faltan para el pitazo inicial</p>
      <div className="flex items-center gap-2 sm:gap-3">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl flex items-center justify-center font-display font-bold text-white relative overflow-hidden"
                style={{
                  fontSize: "clamp(1.4rem, 4vw, 2rem)",
                  background: "rgba(139,26,47,0.25)",
                  border: "1px solid rgba(139,26,47,0.6)",
                  boxShadow: "0 0 16px rgba(139,26,47,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                  minWidth: "3.5rem",
                }}
              >
                {/* Inner highlight */}
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
                <span className="relative z-10 tabular-nums">{String(unit.value).padStart(2, "0")}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1.5 tracking-widest font-semibold">
                {unit.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="text-lg font-bold mb-5" style={{ color: "rgba(139,26,47,0.7)" }}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
