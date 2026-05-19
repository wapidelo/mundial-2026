"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: email.split("@")[0] },
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #1a0a0f 50%, #0a0f1e 100%)" }}>

      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4">⚽</div>
        <h1 className="text-3xl font-bold text-white">Quiniela</h1>
        <p className="text-lg font-semibold mt-1" style={{ color: "#fecc02" }}>
          Mundial 2026
        </p>
        <p className="text-slate-400 text-sm mt-2">
          USA · México · Canadá
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-8"
        style={{ background: "rgba(17,24,39,0.9)", backdropFilter: "blur(12px)" }}>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              ¡Revisa tu correo!
            </h2>
            <p className="text-slate-400 text-sm">
              Enviamos un enlace mágico a{" "}
              <span className="text-white font-medium">{email}</span>.
              Haz clic en el enlace para ingresar.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-slate-500 hover:text-slate-300 underline"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white mb-1">Ingresar</h2>
            <p className="text-slate-400 text-sm mb-6">
              Te enviaremos un enlace mágico a tu correo
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-500 focus:border-red-800"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-semibold"
                style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
              >
                {loading ? "Enviando..." : "Enviar enlace →"}
              </Button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-600">
        Mundial 2026 · 11 jun – 19 jul
      </p>
    </div>
  )
}
