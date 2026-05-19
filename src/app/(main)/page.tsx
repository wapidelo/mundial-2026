import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Countdown } from "@/components/countdown"
import { AnimatedNumber } from "@/components/animated-number"

export default async function HomePage() {
  const supabase = await createClient()

  const [{ count: playerCount }, { count: predictionCount }, { count: matchCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("predictions").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
  ])

  const tournamentStart = process.env.TOURNAMENT_START ?? "2026-06-11T19:00:00Z"

  return (
    <div className="flex flex-col items-center gap-6">

      {/* ── Hero ───────────────────────────────────────── */}
      <div className="w-full rounded-2xl overflow-hidden relative"
        style={{
          background: "linear-gradient(160deg, #1c0810 0%, #0a0f2e 45%, #05130a 100%)",
          border: "1px solid rgba(254,204,2,0.12)",
        }}>

        {/* Radial glow behind title */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(139,26,47,0.35) 0%, transparent 70%)",
        }} />

        {/* Subtle grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative z-10 px-5 sm:px-10 py-10 sm:py-16 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "rgba(254,204,2,0.1)",
              border: "1px solid rgba(254,204,2,0.3)",
              color: "#fecc02",
            }}>
            🌍 USA · México · Canadá &nbsp;·&nbsp; 11 jun – 19 jul 2026
          </div>

          {/* Title */}
          <h1 className="font-display text-6xl sm:text-8xl font-bold text-white leading-none mb-1 tracking-tight">
            QUINIELA
          </h1>
          <p className="font-display text-5xl sm:text-7xl font-bold leading-none"
            style={{
              background: "linear-gradient(135deg, #fecc02 30%, #f59e0b 70%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
            MUNDIAL 2026
          </p>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 my-7">
            <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(90deg, transparent, rgba(254,204,2,0.3))" }} />
            <span className="text-2xl">⚽</span>
            <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(90deg, rgba(254,204,2,0.3), transparent)" }} />
          </div>

          <Countdown targetDate={tournamentStart} />

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/predictions">
              <Button size="lg" className="font-bold px-8 h-12 text-base"
                style={{
                  background: "linear-gradient(135deg, #8b1a2f, #c0392b)",
                  boxShadow: "0 4px 24px rgba(139,26,47,0.45)",
                }}>
                🎯 Mis predicciones
              </Button>
            </Link>
            <Link href="/estadisticas">
              <Button size="lg" variant="outline"
                className="font-semibold border-white/20 text-white hover:bg-white/10 h-12 text-base">
                📊 Estadísticas
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
        {[
          { icon: "👥", label: "Participantes", value: playerCount ?? 0, color: "#60a5fa" },
          { icon: "🎯", label: "Predicciones", value: predictionCount ?? 0, color: "#34d399" },
          { icon: "⚽", label: "Partidos", value: matchCount ?? 0, color: "#fecc02" },
          { icon: "🌍", label: "Equipos", value: 48, color: "#f87171" },
        ].map((stat) => (
          <div key={stat.label}
            className="rounded-xl p-4 text-center group hover:scale-[1.03] transition-all duration-200 relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl transition-all duration-300 group-hover:w-1"
              style={{ background: stat.color }} />
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-foreground font-mono" style={{ color: stat.color }}>
              <AnimatedNumber value={stat.value} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Scoring system ─────────────────────────────── */}
      <div className="w-full rounded-xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <span className="text-base">📋</span>
          <h2 className="font-display text-xl font-bold text-foreground tracking-wide">SISTEMA DE PUNTOS</h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Marcador exacto", pts: "+3 pts", color: "#10b981", glow: "rgba(16,185,129,0.15)", icon: "🎯" },
            { label: "Ganador correcto", pts: "+2 pts", color: "#38bdf8", glow: "rgba(56,189,248,0.15)", icon: "✅" },
            { label: "Empate correcto", pts: "+1 pt", color: "#eab308", glow: "rgba(234,179,8,0.15)", icon: "🤝" },
            { label: "Campeón / 3er lugar", pts: "+5 / +3", color: "#fecc02", glow: "rgba(254,204,2,0.15)", icon: "🏆" },
          ].map((item) => (
            <div key={item.label}
              className="flex flex-col items-center p-3 rounded-xl border hover:scale-[1.03] transition-all duration-200"
              style={{
                background: item.glow,
                borderColor: `${item.color}30`,
              }}>
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="font-display text-2xl font-bold" style={{ color: item.color }}>
                {item.pts}
              </span>
              <span className="text-xs text-muted-foreground text-center mt-1 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
