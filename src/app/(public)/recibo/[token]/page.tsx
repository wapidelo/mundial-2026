import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import type { PredictionSnapshotItem, BonusSnapshot } from "@/lib/email"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const ROUND_LABELS: Record<string, string> = {
  group: "Grupo",
  round_of_32: "Ronda de 32",
  round_of_16: "Octavos",
  quarter_final: "Cuartos",
  semi_final: "Semifinal",
  third_place: "3er Lugar",
  final: "Final",
}

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const service = createServiceClient()
  const { data: receipt } = await service
    .from("prediction_receipts")
    .select("display_name, predictions_snapshot, bonus_snapshot, updated_at, token")
    .eq("token", token)
    .single()

  if (!receipt) notFound()

  const predictions = (receipt.predictions_snapshot ?? []) as PredictionSnapshotItem[]
  const bonus = receipt.bonus_snapshot as BonusSnapshot | null
  const verificationCode = (receipt.token as string).slice(0, 8).toUpperCase()
  const savedAt = new Date(receipt.updated_at).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "full",
    timeStyle: "short",
  })

  // Group predictions by round
  const byRound = predictions.reduce<Record<string, PredictionSnapshotItem[]>>((acc, p) => {
    const r = p.round ?? "group"
    if (!acc[r]) acc[r] = []
    acc[r].push(p)
    return acc
  }, {})

  const roundOrder = ["group", "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⚽</div>
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground">QUINIELA 2026</h1>
        <p className="text-muted-foreground text-sm mt-1">Recibo de predicciones verificado</p>
      </div>

      {/* Identity + verification strip */}
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Participante</p>
          <p className="font-bold text-foreground text-xl">{receipt.display_name}</p>
          <p className="text-xs text-muted-foreground mt-1">{savedAt}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Código de verificación</p>
          <p className="font-mono font-black text-yellow-500 text-2xl tracking-widest">{verificationCode}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{predictions.length} predicciones</p>
        </div>
      </div>

      {/* Bonus predictions */}
      {bonus && (bonus.champion_name || bonus.third_place_name) && (
        <div className="rounded-xl border border-border/20 bg-foreground/[0.02] p-4 mb-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Predicciones Bonus</p>
          <div className="flex gap-6 flex-wrap">
            {bonus.champion_name && (
              <div>
                <p className="text-xs text-muted-foreground">🏆 Campeón</p>
                <p className="font-semibold text-foreground">{bonus.champion_flag} {bonus.champion_name}</p>
              </div>
            )}
            {bonus.third_place_name && (
              <div>
                <p className="text-xs text-muted-foreground">🥉 Tercer lugar</p>
                <p className="font-semibold text-foreground">{bonus.third_place_flag} {bonus.third_place_name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Predictions grouped by round */}
      <div className="space-y-4">
        {roundOrder.map((round) => {
          const items = byRound[round]
          if (!items || items.length === 0) return null
          return (
            <div key={round} className="rounded-xl border border-border/20 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/20 bg-foreground/[0.02]">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {ROUND_LABELS[round] ?? round} · {items.length} partidos
                </p>
              </div>
              <div className="divide-y divide-border/10">
                {items.map((p) => (
                  <div key={p.match_number} className="flex items-center gap-2 px-4 py-2.5">
                    <span className="font-mono text-[10px] text-muted-foreground/60 w-7 shrink-0">
                      #{p.match_number}
                    </span>
                    <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                      <span className="text-xs text-foreground/70 truncate text-right">{p.home_label}</span>
                      <span className="text-sm shrink-0">{p.home_flag}</span>
                    </div>
                    <span
                      className="font-mono font-black text-sm shrink-0 px-2.5 py-0.5 rounded text-center"
                      style={{
                        background: "rgba(139,26,47,0.2)",
                        color: "#fecc02",
                        minWidth: "3.2rem",
                      }}
                    >
                      {p.predicted_home}–{p.predicted_away}
                    </span>
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{p.away_flag}</span>
                      <span className="text-xs text-foreground/70 truncate">{p.away_label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground/40 mt-8">
        Recibo público de solo lectura · Quiniela Mundial 2026
      </p>
    </div>
  )
}
