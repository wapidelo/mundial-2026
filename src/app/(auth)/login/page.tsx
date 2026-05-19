"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { checkEmailExists } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const FLAGS = [
  { f: "🇲🇽", x: 5,  y: 12, d: 0,    dur: 4.2 },
  { f: "🇺🇸", x: 88, y: 8,  d: 0.6,  dur: 3.8 },
  { f: "🇨🇦", x: 48, y: 3,  d: 1.2,  dur: 4.5 },
  { f: "🇧🇷", x: 22, y: 75, d: 0.3,  dur: 3.5 },
  { f: "🇦🇷", x: 72, y: 80, d: 1.8,  dur: 4.0 },
  { f: "🇩🇪", x: 15, y: 45, d: 0.9,  dur: 5.0 },
  { f: "🇪🇸", x: 92, y: 55, d: 2.1,  dur: 3.7 },
  { f: "🇫🇷", x: 60, y: 88, d: 0.4,  dur: 4.3 },
  { f: "🇵🇹", x: 35, y: 60, d: 1.5,  dur: 3.9 },
  { f: "🇯🇵", x: 80, y: 35, d: 0.7,  dur: 4.8 },
  { f: "🇰🇷", x: 10, y: 82, d: 2.4,  dur: 3.6 },
  { f: "🇲🇦", x: 55, y: 22, d: 1.1,  dur: 4.1 },
  { f: "🇸🇳", x: 95, y: 70, d: 0.2,  dur: 5.2 },
  { f: "🇸🇦", x: 30, y: 18, d: 1.7,  dur: 3.4 },
  { f: "🇦🇺", x: 70, y: 50, d: 2.8,  dur: 4.6 },
  { f: "🇳🇱", x: 42, y: 90, d: 0.5,  dur: 4.9 },
  { f: "🇧🇪", x: 18, y: 35, d: 3.0,  dur: 3.8 },
  { f: "🇨🇴", x: 85, y: 18, d: 1.3,  dur: 4.4 },
  { f: "🇺🇾", x: 52, y: 68, d: 2.2,  dur: 3.3 },
  { f: "🇨🇭", x: 8,  y: 58, d: 0.8,  dur: 5.1 },
  { f: "🇬🇭", x: 77, y: 92, d: 1.9,  dur: 4.0 },
  { f: "🇮🇷", x: 38, y: 42, d: 3.3,  dur: 3.6 },
  { f: "🇳🇴", x: 65, y: 15, d: 0.1,  dur: 4.7 },
  { f: "🇨🇷", x: 25, y: 95, d: 2.6,  dur: 3.9 },
]

type Step = "email" | "new_user" | "returning"

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [returnName, setReturnName] = useState("")
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    try {
      const result = await checkEmailExists(email)
      if (result.exists) {
        setReturnName(result.name ?? "")
        setStep("returning")
      } else {
        setStep("new_user")
      }
    } catch {
      toast.error("Error al verificar el correo")
    } finally {
      setChecking(false)
    }
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const displayName = step === "new_user" ? name.trim() : returnName
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: displayName ? { display_name: displayName } : undefined,
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  const activeName = step === "returning" ? returnName : name.trim()

  return (
    <>
      <style>{`
        @keyframes floatFlag {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          40%      { transform: translateY(-14px) rotate(2deg); }
          70%      { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes gradientPulse {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes ballSpin {
          from { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.08); }
          to   { transform: rotate(360deg) scale(1); }
        }
        @keyframes hostPop {
          from { opacity:0; transform:scale(0.7); }
          to   { opacity:1; transform:scale(1); }
        }
        .login-bg {
          background: linear-gradient(-45deg, #050c1a, #130717, #0a1628, #1a0a0f, #050c1a);
          background-size: 400% 400%;
          animation: gradientPulse 10s ease infinite;
        }
      `}</style>

      <div className="login-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

        {/* Floating flags */}
        {FLAGS.map((item, i) => (
          <div
            key={i}
            className="absolute select-none pointer-events-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: i % 3 === 0 ? "2rem" : i % 3 === 1 ? "1.5rem" : "1.1rem",
              opacity: 0.12 + (i % 4) * 0.04,
              animation: `floatFlag ${item.dur}s ease-in-out ${item.d}s infinite`,
              filter: "blur(0.4px)",
            }}
          >
            {item.f}
          </div>
        ))}

        {/* Soft radial glow behind card */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,26,47,0.18) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
          }}
        />

        {/* Brand */}
        <div
          className="mb-8 text-center relative z-10"
          style={{ animation: "fadeDown 0.7s ease both" }}
        >
          <div style={{ animation: "ballSpin 6s linear infinite", display: "inline-block" }}>
            <span style={{ fontSize: "4rem", lineHeight: 1 }}>⚽</span>
          </div>

          <h1
            className="font-display font-black tracking-tight text-white mt-3"
            style={{ fontSize: "clamp(2rem, 8vw, 3.2rem)", lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            QUINIELA
          </h1>
          <p
            className="font-display font-bold tracking-widest text-lg mt-0.5"
            style={{ color: "#fecc02", letterSpacing: "0.15em" }}
          >
            MUNDIAL 2026
          </p>

          {/* Host countries */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {[
              { flag: "🇺🇸", name: "USA" },
              { flag: "🇲🇽", name: "México" },
              { flag: "🇨🇦", name: "Canadá" },
            ].map((host, i) => (
              <div
                key={host.name}
                className="flex flex-col items-center gap-0.5"
                style={{ animation: `hostPop 0.5s ease ${0.4 + i * 0.12}s both` }}
              >
                <span style={{ fontSize: "1.6rem" }}>{host.flag}</span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">{host.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-sm relative z-10"
          style={{ animation: "fadeUp 0.7s ease 0.2s both" }}
        >
          <div
            className="rounded-2xl border border-white/10 p-8"
            style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(16px)" }}
          >
            {/* ── Sent confirmation ── */}
            {sent ? (
              <div className="text-center" style={{ animation: "fadeUp 0.4s ease both" }}>
                <div style={{ fontSize: "2.5rem", animation: "hostPop 0.5s ease both" }}>📧</div>
                <h2 className="text-xl font-semibold text-white mt-3 mb-2">
                  {activeName ? `¡Hola, ${activeName}!` : "¡Revisa tu correo!"}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Enviamos un enlace mágico a{" "}
                  <span className="text-white font-medium">{email}</span>.
                  Haz clic en él para ingresar.
                </p>
                <button
                  onClick={() => { setSent(false); setStep("email") }}
                  className="mt-5 text-sm text-slate-500 hover:text-slate-300 underline transition-colors"
                >
                  Usar otro correo
                </button>
              </div>

            ) : step === "email" ? (
              /* ── Step 1: Email ── */
              <>
                <h2 className="text-xl font-semibold text-white mb-1">Ingresar</h2>
                <p className="text-slate-400 text-sm mb-6">Te enviaremos un enlace mágico a tu correo</p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 text-sm">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="bg-white/5 border-white/15 text-white placeholder:text-slate-600 focus:border-red-700 focus:ring-red-700/20 h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={checking}
                    className="w-full h-11 font-semibold text-white tracking-wide"
                    style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
                  >
                    {checking ? "Verificando..." : "Continuar →"}
                  </Button>
                </form>
              </>

            ) : step === "new_user" ? (
              /* ── Step 2a: New user — ask name ── */
              <form onSubmit={handleSendLink} className="space-y-4" style={{ animation: "fadeUp 0.35s ease both" }}>
                <div className="text-center mb-2">
                  <div style={{ fontSize: "1.8rem" }}>✨</div>
                  <h2 className="text-xl font-semibold text-white mt-2 mb-1">¡Bienvenido/a!</h2>
                  <p className="text-slate-400 text-sm">Es tu primera vez. ¿Cómo te llamamos?</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300 text-sm">Tu nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ej. Carlos Ramos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    autoComplete="name"
                    className="bg-white/5 border-white/15 text-white placeholder:text-slate-600 focus:border-red-700 h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full h-11 font-semibold text-white tracking-wide"
                  style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
                >
                  {loading ? "Enviando..." : "Entrar a la quiniela →"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-sm text-slate-500 hover:text-slate-300 underline transition-colors"
                >
                  ← Cambiar correo
                </button>
              </form>

            ) : (
              /* ── Step 2b: Returning user ── */
              <form onSubmit={handleSendLink} className="space-y-4" style={{ animation: "fadeUp 0.35s ease both" }}>
                <div className="text-center mb-2">
                  <div style={{ fontSize: "1.8rem" }}>👋</div>
                  <h2 className="text-xl font-semibold text-white mt-2 mb-1">
                    ¡Hola de nuevo{returnName ? `, ${returnName}` : ""}!
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Te enviamos el enlace a{" "}
                    <span className="text-white font-medium">{email}</span>
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-semibold text-white tracking-wide"
                  style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
                >
                  {loading ? "Enviando..." : "Enviar enlace →"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-sm text-slate-500 hover:text-slate-300 underline transition-colors"
                >
                  ← No soy yo
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-700 mt-5">
            11 jun – 19 jul 2026 · 48 selecciones · 104 partidos
          </p>
        </div>
      </div>
    </>
  )
}
