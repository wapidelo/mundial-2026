import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Countdown } from "@/components/countdown"
import { AnimatedNumber } from "@/components/animated-number"

export default async function HomePage() {
  const supabase = await createClient()

  const [{ count: playerCount }, { count: predictionCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("predictions").select("*", { count: "exact", head: true }),
  ])

  const tournamentStart = process.env.TOURNAMENT_START ?? "2026-06-11T19:00:00Z"

  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <div className="w-full rounded-2xl overflow-hidden mb-8 relative"
        style={{
          background: "linear-gradient(135deg, #1a0a14 0%, #0a0f2e 40%, #0a1a0e 100%)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
        <div className="px-4 sm:px-8 py-10 sm:py-16 text-center relative z-10">
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Quiniela
          </h1>
          <p className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "#fecc02" }}>
            Mundial 2026
          </p>
          <p className="text-slate-400 mb-8">
            🇺🇸 USA · 🇲🇽 México · 🇨🇦 Canadá &nbsp;·&nbsp; 11 jun – 19 jul
          </p>

          <Countdown targetDate={tournamentStart} />

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/predictions">
              <Button size="lg" className="font-bold px-8"
                style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}>
                🎯 Ver mis predicciones
              </Button>
            </Link>
            <Link href="/estadisticas">
              <Button size="lg" variant="outline"
                className="font-semibold border-white/20 text-white hover:bg-white/10">
                📊 Ver estadísticas
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
        {[
          { icon: "👥", label: "Participantes", value: playerCount ?? 0 },
          { icon: "🎯", label: "Predicciones", value: predictionCount ?? 0 },
          { icon: "⚽", label: "Partidos", value: 72 },
          { icon: "🌍", label: "Equipos", value: 48 },
        ].map((stat) => (
          <div key={stat.label}
            className="rounded-xl border border-border/20 p-4 text-center hover:scale-[1.03] transition-transform duration-200"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-foreground font-mono">
              <AnimatedNumber value={stat.value} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sistema de puntos */}
      <div className="w-full rounded-xl border border-border/20 p-6"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <h2 className="text-lg font-bold text-foreground mb-4">📋 Sistema de puntos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Marcador exacto", pts: "+3 pts", color: "#10b981", icon: "🎯" },
            { label: "Ganador correcto", pts: "+2 pts", color: "#38bdf8", icon: "✅" },
            { label: "Empate correcto", pts: "+1 pt", color: "#eab308", icon: "🤝" },
            { label: "Campeón / 3er lugar", pts: "+5 / +3", color: "#fecc02", icon: "🏆" },
          ].map((item) => (
            <div key={item.label}
              className="flex flex-col items-center p-3 rounded-lg border border-border/20 hover:scale-[1.03] transition-transform duration-200"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-lg font-bold font-mono" style={{ color: item.color }}>
                {item.pts}
              </span>
              <span className="text-xs text-muted-foreground text-center mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
