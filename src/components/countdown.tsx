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

  if (!time) return null

  const started = new Date(targetDate) <= new Date()
  if (started) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
        style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
        🟢 ¡El Mundial está en curso!
      </div>
    )
  }

  const units = [
    { label: "días", value: time.days },
    { label: "hrs", value: time.hours },
    { label: "min", value: time.minutes },
    { label: "seg", value: time.seconds },
  ]

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-slate-400">Faltan para el inicio</p>
      <div className="flex items-center gap-2 sm:gap-3">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center font-mono text-xl sm:text-2xl font-bold text-white"
                style={{ background: "rgba(139,26,47,0.3)", border: "1px solid rgba(139,26,47,0.5)" }}>
                {String(unit.value).padStart(2, "0")}
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500 mt-1">{unit.label}</span>
            </div>
            {i < units.length - 1 && (
              <span className="text-lg font-bold text-slate-600 mb-4">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
