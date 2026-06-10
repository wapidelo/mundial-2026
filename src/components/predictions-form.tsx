"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { savePredictions, saveBonusPredictions } from "@/lib/actions/predictions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { calculateMatchPoints, pointsColor, pointsLabel } from "@/lib/scoring"
import type { GroupWithMatches, Match, MatchWithPrediction, Prediction, BonusPrediction, Team, RoundType } from "@/lib/types"

// ─── Types ───────────────────────────────────────────────────────────────────

type PredictionPreview = {
  matchId: number
  matchNumber: number
  homeLabel: string
  awayLabel: string
  homeFlag: string
  awayFlag: string
  homeScore: number
  awayScore: number
}

// ─── Confirmation Dialog ─────────────────────────────────────────────────────

function ConfirmDialog({
  isOpen,
  previews,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  previews: PredictionPreview[]
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-2xl border border-border/30 p-5 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-2 text-3xl">🔒</div>
        <h2 className="text-lg font-bold text-foreground mb-1 text-center">
          Confirmar predicciones
        </h2>
        <p className="text-muted-foreground text-sm mb-3 text-center">
          Guardando{" "}
          <strong className="text-foreground">{previews.length} {previews.length === 1 ? "predicción" : "predicciones"}</strong>
        </p>

        {/* Review list */}
        <div
          className="rounded-xl border border-border/20 divide-y divide-border/10 mb-3 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.3)", maxHeight: "13rem" }}
        >
          {previews.map((p) => (
            <div key={p.matchId} className="flex items-center gap-1.5 px-3 py-2">
              <span className="text-muted-foreground font-mono text-[10px] w-6 shrink-0">
                #{p.matchNumber}
              </span>
              <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
                <span className="text-[11px] text-foreground/70 truncate text-right">{p.homeLabel}</span>
                <span className="shrink-0 text-sm">{p.homeFlag}</span>
              </div>
              <span
                className="font-mono font-black text-sm shrink-0 px-2 py-0.5 rounded-lg tabular-nums"
                style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--accent)", minWidth: "3.5rem", textAlign: "center" }}
              >
                {p.homeScore}–{p.awayScore}
              </span>
              <div className="flex-1 flex items-center gap-1 min-w-0">
                <span className="shrink-0 text-sm">{p.awayFlag}</span>
                <span className="text-[11px] text-foreground/70 truncate">{p.awayLabel}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-indigo-400 text-xs mb-4 text-center font-medium">
          ✏️ Puedes editar tus predicciones hasta el 11 de junio.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors text-sm font-medium"
          >
            Revisar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            ✓ Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Excel Import Modal ───────────────────────────────────────────────────────

function ExcelImportModal({
  groupsWithMatches,
  knockoutMatches,
  onImport,
}: {
  groupsWithMatches: GroupWithMatches[]
  knockoutMatches: MatchWithPrediction[]
  onImport: (predictions: Record<number, { home: number; away: number }>) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    try {
      const { parseExcelFile } = await import("@/lib/excel")
      const matchNumberToId = new Map([
        ...groupsWithMatches.flatMap((g) => g.matches.map((m) => [m.match_number, m.id] as [number, number])),
        ...knockoutMatches.map((m) => [m.match_number, m.id] as [number, number]),
      ])
      const parsed = await parseExcelFile(file, matchNumberToId)
      const count = Object.keys(parsed).length
      if (count === 0) {
        toast.error("No se encontraron predicciones válidas. Revisa que el archivo sea la plantilla correcta.")
      } else {
        onImport(parsed)
        setOpen(false)
        toast.success(`✅ ${count} predicciones importadas — revisa y confirma antes de guardar`)
      }
    } catch {
      toast.error("No se pudo leer el archivo. Asegúrate de subir un .xlsx válido.")
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDownloadTemplate() {
    const { downloadTemplate } = await import("@/lib/excel")
    const matches = [
      ...groupsWithMatches.flatMap((g) =>
        g.matches.map((m) => ({
          match_number: m.match_number,
          home_name: m.home_team?.name ?? "?",
          away_name: m.away_team?.name ?? "?",
        })),
      ),
      ...knockoutMatches.map((m) => ({
        match_number: m.match_number,
        home_name: m.home_team?.name ?? m.home_slot ?? "TBD",
        away_name: m.away_team?.name ?? m.away_slot ?? "TBD",
      })),
    ].sort((a, b) => a.match_number - b.match_number)
    downloadTemplate(matches)
  }

  const STEPS = [
    { n: "1", icon: "⬇️", text: <>Descarga la <strong className="text-foreground">plantilla</strong> con los 104 partidos ya cargados.</> },
    { n: "2", icon: "✏️", text: <>Rellena solo las columnas <strong className="text-foreground">Goles Local</strong> y <strong className="text-foreground">Goles Visitante</strong> (números 0–99).</> },
    { n: "3", icon: "📂", text: <>Guarda y sube el archivo <strong className="text-foreground">.xlsx</strong>.</> },
    { n: "4", icon: "✅", text: <>Los marcadores aparecen en el formulario. <strong className="text-foreground">Revísalos y guarda.</strong></> },
  ]

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
        style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", borderColor: "rgba(99,102,241,0.25)" }}
      >
        📊 Importar desde Excel
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border border-border/30 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/20"
              style={{ background: "rgba(99,102,241,0.08)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <div>
                  <p className="font-bold text-foreground text-sm leading-tight">Importar desde Excel</p>
                  <p className="text-xs text-muted-foreground">Llena tus 104 predicciones de un jalón</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-foreground/5"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {/* Steps */}
              <ol className="space-y-3">
                {STEPS.map(({ n, icon, text }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                      {n}
                    </span>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      <span className="mr-1">{icon}</span>{text}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Column reference */}
              <div className="overflow-x-auto rounded-lg border border-border/30">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      {["# Partido", "Local", "Visitante", "Goles Local ✏️", "Goles Visit. ✏️"].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-semibold text-muted-foreground border-b border-border/20 whitespace-nowrap"
                          style={h.includes("✏️") ? { color: "#a5b4fc" } : undefined}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["1", "Sudáfrica", "México", "1", "2"],
                      ["2", "Chequia", "Corea del Sur", "0", "0"],
                      ["3", "Canadá", "Honduras", "", ""],
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1.5 font-mono"
                            style={{ color: j >= 3 ? (cell ? "#a5b4fc" : "#374151") : "#94a3b8" }}>
                            {cell || <span className="opacity-30">–</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Las columnas A, B y C ya vienen llenas. Solo escribe en D y E.
              </p>

              {/* Warning */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 px-3 py-2.5"
                style={{ background: "rgba(245,158,11,0.05)" }}>
                <span className="text-sm shrink-0">⚠️</span>
                <p className="text-xs text-amber-400 leading-relaxed">
                  La importación <strong>no guarda</strong> automáticamente. Después de importar, haz clic en <strong>"Guardar"</strong> para confirmarlas.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-2 px-5 py-4 border-t border-border/20">
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border border-border/30 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                ⬇️ Descargar plantilla
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50"
                style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", borderColor: "rgba(99,102,241,0.3)" }}
              >
                {isLoading ? <><span className="animate-spin">⟳</span> Leyendo...</> : <>📂 Subir .xlsx</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Round Labels ─────────────────────────────────────────────────────────────

const ROUND_LABELS: Record<RoundType, string> = {
  group: "Fase de Grupos",
  round_of_32: "🏟️ Ronda de 32",
  round_of_16: "⚔️ Octavos de Final",
  quarter_final: "🔥 Cuartos de Final",
  semi_final: "🌟 Semifinales",
  third_place: "🥉 Tercer Lugar",
  final: "🏆 Final",
}

const KNOCKOUT_ORDER: RoundType[] = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"]

// ─── Score Input ──────────────────────────────────────────────────────────────

function ScoreInput({
  name,
  defaultValue,
  disabled,
}: {
  name: string
  defaultValue?: number
  disabled: boolean
}) {
  return (
    <input
      type="number"
      name={name}
      defaultValue={defaultValue ?? ""}
      min={0}
      max={99}
      disabled={disabled}
      placeholder="–"
      className={cn(
        "w-12 h-12 text-center text-2xl font-mono font-bold rounded-lg border bg-muted/50 text-foreground",
        "focus:outline-none focus:border-primary transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30",
        defaultValue !== undefined ? "border-border/30" : "border-border/10",
      )}
    />
  )
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({
  match,
  disabled,
  importedHome,
  importedAway,
  importKey,
}: {
  match: MatchWithPrediction
  disabled: boolean
  importedHome?: number
  importedAway?: number
  importKey: number
}) {
  const pred = match.prediction
  const hasResult = match.home_score !== null && match.away_score !== null

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-colors",
      pred ? "border-border/30 bg-foreground/[0.02]" : "border-border/10 bg-transparent",
      hasResult && "border-emerald-500/20 bg-emerald-500/5",
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">
          #{match.match_number} · {new Date(match.scheduled_at).toLocaleDateString("es-MX", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
          })}
        </span>
        {hasResult && pred?.points !== null && pred?.points !== undefined && (
          <span className={cn("text-xs font-semibold", pointsColor(pred.points))}>
            {pointsLabel(pred.points)}
          </span>
        )}
        {pred && !hasResult && !disabled && (
          <span className="text-xs text-muted-foreground">✏️ guardado</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 text-right">
          <span className="text-base mr-1">{match.home_team?.flag_emoji ?? "🏳️"}</span>
          <span className={cn("text-sm font-medium", match.home_team ? "text-foreground" : "text-muted-foreground italic")}>
            {match.home_team?.name ?? match.home_slot ?? "TBD"}
          </span>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-2 shrink-0">
          <ScoreInput
            key={`${match.id}_home_${importKey}`}
            name={`prediction_${match.id}_home`}
            defaultValue={pred?.predicted_home_score ?? importedHome}
            disabled={disabled}
          />
          <span className="text-muted-foreground font-bold text-lg">—</span>
          <ScoreInput
            key={`${match.id}_away_${importKey}`}
            name={`prediction_${match.id}_away`}
            defaultValue={pred?.predicted_away_score ?? importedAway}
            disabled={disabled}
          />
        </div>

        {/* Away team */}
        <div className="flex-1 text-left">
          <span className={cn("text-sm font-medium", match.away_team ? "text-foreground" : "text-muted-foreground italic")}>
            {match.away_team?.name ?? match.away_slot ?? "TBD"}
          </span>
          <span className="text-base ml-1">{match.away_team?.flag_emoji ?? "🏳️"}</span>
        </div>
      </div>

      {/* Real result */}
      {hasResult && (
        <div className="mt-2 text-center">
          <span className="text-xs text-muted-foreground">
            Resultado real:{" "}
            <span className="font-mono font-bold text-foreground">
              {match.home_score} — {match.away_score}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Group Section ────────────────────────────────────────────────────────────

function GroupSection({
  group,
  disabled,
  importedPredictions,
  importKey,
  onSectionSave,
}: {
  group: GroupWithMatches
  disabled: boolean
  importedPredictions: Record<number, { home: number; away: number }>
  importKey: number
  onSectionSave: (matchIds: number[]) => void
}) {
  const predicted = group.matches.filter((m) => m.prediction).length
  const unpredicted = group.matches.filter((m) => !m.prediction).length
  return (
    <details open className="rounded-xl border border-border/20 overflow-hidden">
      <summary
        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none list-none"
        style={{ background: "rgba(139,26,47,0.12)", borderBottom: "1px solid rgba(139,26,47,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-foreground opacity-40">
            {group.name}
          </span>
          <div className="flex gap-1">
            {group.teams.map((t) => (
              <span key={t.id} title={t.name} className="text-lg">{t.flag_emoji}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn("font-mono font-bold", predicted === 6 ? "text-emerald-500" : "text-muted-foreground")}>
            {predicted}/6
          </span>
          <span className="text-muted-foreground">▾</span>
        </div>
      </summary>
      <div className="p-4 grid gap-3 sm:grid-cols-2">
        {group.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            disabled={disabled}
            importedHome={importedPredictions[match.id]?.home}
            importedAway={importedPredictions[match.id]?.away}
            importKey={importKey}
          />
        ))}
      </div>
      {!disabled && (
        <div className="px-4 pb-3 pt-0 flex justify-end">
          <button
            type="button"
            onClick={() => onSectionSave(group.matches.map((m) => m.id))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{ background: "rgba(139,26,47,0.2)", color: "#fca5a5", border: "1px solid rgba(139,26,47,0.3)" }}
          >
            💾 Guardar Grupo {group.name}
          </button>
        </div>
      )}
    </details>
  )
}

// ─── Knockout Section ─────────────────────────────────────────────────────────

function KnockoutSection({
  round,
  matches,
  disabled,
  importedPredictions,
  importKey,
  onSectionSave,
}: {
  round: RoundType
  matches: MatchWithPrediction[]
  disabled: boolean
  importedPredictions: Record<number, { home: number; away: number }>
  importKey: number
  onSectionSave: (matchIds: number[]) => void
}) {
  const predicted = matches.filter((m) => m.prediction).length
  const unpredicted = matches.filter((m) => !m.prediction).length
  return (
    <details open className="rounded-xl border border-border/20 overflow-hidden">
      <summary
        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none list-none"
        style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.15)" }}
      >
        <span className="font-bold text-foreground">{ROUND_LABELS[round]}</span>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn("font-mono font-bold", predicted === matches.length ? "text-emerald-500" : "text-muted-foreground")}>
            {predicted}/{matches.length}
          </span>
          <span className="text-muted-foreground">▾</span>
        </div>
      </summary>
      <div className="p-4 grid gap-3 sm:grid-cols-2">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            disabled={disabled}
            importedHome={importedPredictions[match.id]?.home}
            importedAway={importedPredictions[match.id]?.away}
            importKey={importKey}
          />
        ))}
      </div>
      {!disabled && (
        <div className="px-4 pb-3 pt-0 flex justify-end">
          <button
            type="button"
            onClick={() => onSectionSave(matches.map((m) => m.id))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            💾 Guardar {ROUND_LABELS[round]}
          </button>
        </div>
      )}
    </details>
  )
}

// ─── Bonus Section ────────────────────────────────────────────────────────────

function BonusSection({
  allTeams,
  bonus,
  disabled,
}: {
  allTeams: Team[]
  bonus: BonusPrediction | null
  disabled: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await saveBonusPredictions(fd)
        toast.success("Predicciones bonus guardadas")
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error al guardar")
      }
    })
  }

  const champTeam = allTeams.find((t) => t.id === bonus?.champion_team_id)
  const thirdTeam = allTeams.find((t) => t.id === bonus?.third_place_team_id)

  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ borderColor: "rgba(254,204,2,0.3)", background: "rgba(254,204,2,0.04)" }}>
      <div className="px-5 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(254,204,2,0.15)" }}>
        <span className="text-2xl">🏆</span>
        <div>
          <h3 className="font-bold text-foreground">Predicciones Bonus</h3>
          <p className="text-xs text-muted-foreground">Campeón +5 pts · Tercer lugar +3 pts</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Campeón */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              🥇 Campeón del Mundial
              {bonus?.champion_points ? (
                <span className="ml-2 text-yellow-500 font-bold">+{bonus.champion_points} pts</span>
              ) : null}
            </label>
            {champTeam && (
              <p className="text-xs text-muted-foreground mb-1">
                Actual: {champTeam.flag_emoji} {champTeam.name}
              </p>
            )}
            <select
              name="champion_team_id"
              defaultValue={bonus?.champion_team_id ?? ""}
              disabled={disabled}
              className="w-full rounded-lg border border-border/30 bg-input text-foreground px-3 py-2 text-sm focus:outline-none focus:border-yellow-600 disabled:opacity-60"
            >
              <option value="">— Seleccionar equipo —</option>
              {allTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.flag_emoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tercer lugar */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              🥉 Tercer lugar
              {bonus?.third_place_points ? (
                <span className="ml-2 text-foreground/60 font-bold">+{bonus.third_place_points} pts</span>
              ) : null}
            </label>
            {thirdTeam && (
              <p className="text-xs text-muted-foreground mb-1">
                Actual: {thirdTeam.flag_emoji} {thirdTeam.name}
              </p>
            )}
            <select
              name="third_place_team_id"
              defaultValue={bonus?.third_place_team_id ?? ""}
              disabled={disabled}
              className="w-full rounded-lg border border-border/30 bg-input text-foreground px-3 py-2 text-sm focus:outline-none focus:border-yellow-600 disabled:opacity-60"
            >
              <option value="">— Seleccionar equipo —</option>
              {allTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.flag_emoji} {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!disabled && (
          <Button
            type="submit"
            disabled={isPending}
            className="mt-4 font-semibold"
            style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)" }}
          >
            {isPending ? "Guardando..." : "💾 Guardar predicciones bonus"}
          </Button>
        )}
      </form>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function PredictionsForm({
  groupsWithMatches,
  knockoutMatches,
  predictionMap,
  bonusPrediction,
  allTeams,
  isClosed,
  openRounds,
  userId,
  totalMatchCount,
}: {
  groupsWithMatches: GroupWithMatches[]
  knockoutMatches: MatchWithPrediction[]
  predictionMap: Record<number, Prediction>
  bonusPrediction: BonusPrediction | null
  allTeams: Team[]
  isClosed: boolean
  openRounds: string[]
  userId: string
  totalMatchCount: number
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
  const [pendingPreviews, setPendingPreviews] = useState<PredictionPreview[]>([])
  const [importedPredictions, setImportedPredictions] = useState<Record<number, { home: number; away: number }>>({})
  const [importKey, setImportKey] = useState(0)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const predMap = predictionMap

    const channel = supabase
      .channel("predictions-results")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const match = payload.new as Match
          if (match.home_score === null || match.away_score === null) return
          const pred = predMap[match.id]
          if (!pred) return
          const pts = calculateMatchPoints(
            { home: pred.predicted_home_score, away: pred.predicted_away_score },
            { home: match.home_score, away: match.away_score },
          )
          toast.success(
            `⚽ Resultado: ${match.home_score} — ${match.away_score} · ${pointsLabel(pts)}`,
            { duration: 8000 },
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  function buildPreviews(fd: FormData, targetIds?: Set<number>): { filteredFd: FormData; previews: PredictionPreview[] } {
    const allMatches = [
      ...groupsWithMatches.flatMap((g) => g.matches),
      ...knockoutMatches,
    ]
    const filteredFd = new FormData()
    const previews: PredictionPreview[] = []
    for (const match of allMatches) {
        if (targetIds && !targetIds.has(match.id)) continue
      const home = fd.get(`prediction_${match.id}_home`)
      const away = fd.get(`prediction_${match.id}_away`)
      if (home === null || home === "" || away === null || away === "") continue
      filteredFd.set(`prediction_${match.id}_home`, home)
      filteredFd.set(`prediction_${match.id}_away`, away)
      previews.push({
        matchId: match.id,
        matchNumber: match.match_number,
        homeLabel: match.home_team?.name ?? match.home_slot ?? "TBD",
        awayLabel: match.away_team?.name ?? match.away_slot ?? "TBD",
        homeFlag: match.home_team?.flag_emoji ?? "🏳️",
        awayFlag: match.away_team?.flag_emoji ?? "🏳️",
        homeScore: Number(home),
        awayScore: Number(away),
      })
    }
    previews.sort((a, b) => a.matchNumber - b.matchNumber)
    return { filteredFd, previews }
  }

  function openConfirm(filteredFd: FormData, previews: PredictionPreview[]) {
    if (previews.length === 0) {
      toast.info("No hay predicciones nuevas que guardar en esta sección")
      return
    }
    setPendingPreviews(previews)
    setPendingFormData(filteredFd)
    setConfirmOpen(true)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const { filteredFd, previews } = buildPreviews(fd)
    openConfirm(filteredFd, previews)
  }

  function handleSectionSave(matchIds: number[]) {
    if (!formRef.current) return
    const fd = new FormData(formRef.current)
    const { filteredFd, previews } = buildPreviews(fd, new Set(matchIds))
    openConfirm(filteredFd, previews)
  }

  function handleConfirm() {
    if (!pendingFormData) return
    setConfirmOpen(false)
    startTransition(async () => {
      try {
        await savePredictions(pendingFormData)
        toast.success("¡Predicciones guardadas!")
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error al guardar")
      } finally {
        setPendingFormData(null)
      }
    })
  }

  function handleImport(parsed: Record<number, { home: number; away: number }>) {
    setImportedPredictions(parsed)
    setImportKey((k) => k + 1)
  }

  const totalPredicted = Object.keys(predictionMap).length

  return (
    <div className="space-y-4">
      <ConfirmDialog
        isOpen={confirmOpen}
        previews={pendingPreviews}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Progress bar + Excel import button */}
      {!isClosed && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(totalPredicted / totalMatchCount) * 100}%`,
                background: "linear-gradient(90deg, var(--primary), var(--accent))",
              }}
            />
          </div>
          <span className="text-sm text-muted-foreground shrink-0 font-mono">
            {totalPredicted}/{totalMatchCount}
          </span>
          <ExcelImportModal
            groupsWithMatches={groupsWithMatches}
            knockoutMatches={knockoutMatches}
            onImport={handleImport}
          />
        </div>
      )}

      {/* Match predictions form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        {groupsWithMatches.map((group) => (
          <GroupSection
            key={group.id}
            group={group}
            disabled={isClosed}
            importedPredictions={importedPredictions}
            importKey={importKey}
            onSectionSave={handleSectionSave}
          />
        ))}

        {isClosed && openRounds.length === 0 && (
          <div className="rounded-xl border border-border/20 p-6 text-center"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-3xl mb-3 block">⏳</span>
            <p className="font-bold text-foreground mb-1">Esperando siguiente fase</p>
            <p className="text-muted-foreground text-sm">
              La ronda eliminatoria se habilitará cuando el administrador la abra.
            </p>
          </div>
        )}

        {KNOCKOUT_ORDER.map((round) => {
          const roundMatches = knockoutMatches.filter((m) => m.round === round)
          if (roundMatches.length === 0) return null
          if (!openRounds.includes(round)) return null
          return (
            <KnockoutSection
              key={round}
              round={round}
              matches={roundMatches}
              disabled={false}
              importedPredictions={importedPredictions}
              importKey={importKey}
              onSectionSave={handleSectionSave}
            />
          )
        })}

        {!isClosed && (
          <div className="sticky bottom-4">
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="w-full font-bold shadow-2xl"
              style={{ background: "var(--primary)" }}
            >
              {isPending ? "Guardando..." : "💾 Guardar todas las predicciones"}
            </Button>
          </div>
        )}
      </form>

      {/* Bonus section — secondary, shown after main predictions */}
      <BonusSection allTeams={allTeams} bonus={bonusPrediction} disabled={isClosed} />
    </div>
  )
}
