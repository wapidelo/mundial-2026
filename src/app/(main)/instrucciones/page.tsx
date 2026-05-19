export default function InstruccionesPage() {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
          ¿CÓMO FUNCIONA?
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Todo lo que necesitas saber para ganar la quiniela del Mundial 2026.
        </p>
      </div>

      {/* ¿Qué es? */}
      <Section icon="🌍" title="QUÉ ES LA QUINIELA">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Predice el marcador de <strong className="text-foreground">104 partidos</strong> del
          Mundial 2026 — 72 de fase de grupos + 32 eliminatorios — y compite con tu grupo de amigos
          por el primer lugar de la tabla de posiciones.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {["🇺🇸 EUA", "🇲🇽 México", "🇨🇦 Canadá", "48 equipos", "104 partidos"].map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(139,26,47,0.2)", color: "#f87171", border: "1px solid rgba(139,26,47,0.3)" }}>
              {tag}
            </span>
          ))}
        </div>
      </Section>

      {/* Paso a paso */}
      <Section icon="📋" title="PASO A PASO">
        <ol className="space-y-4">
          {[
            {
              n: "01",
              icon: "🎯",
              title: "Predice los partidos",
              desc: 'Ve a "Quiniela" e ingresa el marcador que crees que va a terminar cada partido. Ejemplo: México 2 – 0 Ecuador.',
            },
            {
              n: "02",
              icon: "💾",
              title: "Guarda y bloquea",
              desc: "Cuando hayas llenado los partidos que quieras, haz clic en Guardar. ⚠️ Una vez guardadas, las predicciones no se pueden cambiar.",
            },
            {
              n: "03",
              icon: "🏆",
              title: "Haz tus predicciones bonus",
              desc: "Predice quién será el Campeón y el Tercer Lugar del Mundial para ganar puntos extra al final del torneo.",
            },
            {
              n: "04",
              icon: "⚽",
              title: "Sigue los partidos en tiempo real",
              desc: 'Ve a "Partidos" para ver los resultados. El marcador se actualiza en tiempo real y tus puntos se calculan automáticamente.',
            },
            {
              n: "05",
              icon: "📊",
              title: "Escala en la tabla",
              desc: '"Tabla de Posiciones" se actualiza en vivo cuando hay resultados.',
            },
            {
              n: "06",
              icon: "🥊",
              title: "Predice las eliminatorias desde hoy",
              desc: "Los 32 partidos eliminatorios (R32, Octavos, Cuartos, Semis y Final) ya están disponibles. Predice quién gana cada llave aunque todavía no sepas los equipos.",
            },
          ].map(({ n, icon, title, desc }) => (
            <li key={n} className="flex gap-4">
              <div className="shrink-0">
                <span className="font-display text-2xl font-bold" style={{ color: "rgba(139,26,47,0.6)" }}>{n}</span>
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-foreground mb-0.5">{icon} {title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Sistema de puntos */}
      <Section icon="🔢" title="SISTEMA DE PUNTOS">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { pts: "3", color: "#34d399", glow: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.25)", icon: "🎯", label: "Marcador exacto", desc: "Acertaste el marcador exacto" },
            { pts: "2", color: "#60a5fa", glow: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.25)", icon: "✅", label: "Ganador correcto", desc: "Acertaste quién ganó" },
            { pts: "1", color: "#a78bfa", glow: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)", icon: "🤝", label: "Empate correcto", desc: "Predijiste empate, fue empate" },
            { pts: "0", color: "#64748b", glow: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.15)", icon: "❌", label: "Fallo", desc: "Equipo o resultado incorrecto" },
          ].map(({ pts, color, glow, border, icon, label, desc }) => (
            <div key={pts} className="rounded-xl p-3 flex flex-col"
              style={{ background: glow, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-bold text-3xl" style={{ color }}>{pts}</span>
                <span className="text-base">{icon}</span>
              </div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground px-1">
          💡 Los puntos se calculan con el resultado <strong className="text-foreground">a 90 minutos</strong>.
          En eliminatorias, si va a penales solo cuenta el marcador reglamentario.
        </p>
      </Section>

      {/* Bonus */}
      <Section icon="⭐" title="PREDICCIONES BONUS">
        <div className="space-y-2">
          {[
            { emoji: "🥇", label: "Campeón del Mundial", pts: "+5 pts", color: "#fecc02", desc: "Elige al campeón. Si aciertas, recibes puntos extra al final del torneo." },
            { emoji: "🥉", label: "Tercer lugar", pts: "+3 pts", color: "#f59e0b", desc: "Elige al equipo de bronce. Puntos extra si aciertas." },
          ].map(({ emoji, label, pts, color, desc }) => (
            <div key={label} className="flex gap-3 items-start rounded-xl p-3"
              style={{ background: "rgba(254,204,2,0.05)", border: "1px solid rgba(254,204,2,0.15)" }}>
              <span className="text-2xl shrink-0">{emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <span className="font-display text-sm font-bold" style={{ color }}>{pts}</span>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Estructura del torneo */}
      <Section icon="🗓️" title="ESTRUCTURA DEL TORNEO">
        <div className="space-y-0 divide-y divide-border/10">
          {[
            { label: "Fase de grupos", matches: 72, icon: "⚽", color: "#94a3b8" },
            { label: "Ronda de 32", matches: 16, icon: "🏟️", color: "#60a5fa" },
            { label: "Octavos de final", matches: 8, icon: "⚔️", color: "#60a5fa" },
            { label: "Cuartos de final", matches: 4, icon: "🔥", color: "#f59e0b" },
            { label: "Semifinales", matches: 2, icon: "🌟", color: "#f59e0b" },
            { label: "Tercer lugar", matches: 1, icon: "🥉", color: "#a78bfa" },
            { label: "Final", matches: 1, icon: "🏆", color: "#fecc02" },
          ].map(({ label, matches, icon, color }) => (
            <div key={label} className="flex items-center py-2.5 gap-3">
              <span className="text-base w-6 text-center shrink-0">{icon}</span>
              <span className="text-sm text-foreground/80 flex-1">{label}</span>
              <span className="font-display font-bold text-xl w-8 text-right shrink-0" style={{ color }}>
                {matches}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/20 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Total partidos</span>
          <span className="font-display font-bold text-2xl" style={{ color: "#fecc02" }}>104</span>
        </div>
      </Section>

      {/* Reglas */}
      <Section icon="📜" title="REGLAS IMPORTANTES">
        <ul className="space-y-2.5">
          {[
            "Una vez guardadas, las predicciones NO se pueden modificar.",
            "Solo puedes predecir partidos antes de que inicien (11 de junio 2026 para grupos).",
            "Los 32 partidos eliminatorios están disponibles desde el primer día — puedes predecir toda la quiniela de una sola vez.",
            "Los puntos se actualizan automáticamente cuando el admin ingresa el resultado.",
          ].map((rule, i) => (
            <li key={i} className="flex gap-2.5 text-xs text-muted-foreground">
              <span className="shrink-0 font-display font-bold text-sm mt-px" style={{ color: "rgba(139,26,47,0.8)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Fechas clave */}
      <Section icon="📅" title="FECHAS CLAVE">
        <div className="space-y-2.5">
          {[
            { date: "Antes del 11 jun", event: "Cierre de predicciones de fase de grupos", color: "#f59e0b" },
            { date: "11 jun 2026", event: "Inicio del torneo — partido inaugural", color: "#ef4444" },
            { date: "Julio 2026", event: "Inicio de la fase eliminatoria (R32)", color: "#60a5fa" },
            { date: "26 jul 2026", event: "Final del Mundial 2026", color: "#fecc02" },
          ].map(({ date, event, color }) => (
            <div key={date} className="flex items-start gap-3">
              <span className="shrink-0 font-display font-bold text-sm w-32 leading-tight" style={{ color }}>{date}</span>
              <span className="text-xs text-muted-foreground leading-relaxed">{event}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/15 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="px-5 py-3 border-b border-border/10 flex items-center gap-2"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <span className="text-base">{icon}</span>
        <h2 className="font-display font-bold text-foreground tracking-wide text-lg">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}
