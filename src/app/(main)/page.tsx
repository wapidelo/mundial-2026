import { Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Countdown } from "@/components/countdown"
import { AnimatedNumber } from "@/components/animated-number"
import { WelcomeToast } from "@/components/welcome-toast"

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
      <Suspense fallback={null}>
        <WelcomeToast />
      </Suspense>

      {/* ── Hero ───────────────────────────────────────── */}
      <div className="w-full rounded-2xl overflow-hidden relative"
        style={{
          background: "linear-gradient(160deg, color-mix(in srgb, var(--primary) 8%, var(--background)) 0%, var(--background) 60%)",
          border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
        }}>

        {/* Radial glow behind title */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 30%, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 70%)",
        }} />

        <div className="relative z-10 px-5 sm:px-10 py-10 sm:py-16 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "color-mix(in srgb, var(--primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
              color: "var(--primary)",
            }}>
            🌍 USA · México · Canadá &nbsp;·&nbsp; 11 jun – 19 jul 2026
          </div>

          {/* Logo + título */}
          <div className="flex flex-col items-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-tupperware.jpeg" alt="Tupperware" className="h-24 sm:h-32 w-auto object-contain rounded-xl" />
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-none tracking-tight">
              QUINIELA <span style={{ color: "var(--primary)" }}>2026</span>
            </h1>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 my-6">
            <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 40%, transparent))" }} />
            <span className="text-2xl">⚽</span>
            <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--primary) 40%, transparent), transparent)" }} />
          </div>

          <Countdown targetDate={tournamentStart} />

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/predictions">
              <Button size="lg" className="font-bold px-8 h-12 text-base text-white"
                style={{
                  background: "var(--primary)",
                  boxShadow: "0 4px 24px color-mix(in srgb, var(--primary) 35%, transparent)",
                }}>
                🎯 Mis predicciones
              </Button>
            </Link>
            <Link href="/estadisticas">
              <Button size="lg" variant="outline"
                className="font-semibold h-12 text-base">
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
