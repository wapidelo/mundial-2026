"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { savePredictions, saveBonusPredictions } from "@/lib/actions/predictions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { pointsColor, pointsLabel } from "@/lib/scoring"
import type { GroupWithMatches, Prediction, BonusPrediction, Team } from "@/lib/types"

// ─── Confirmation Dialog ─────────────────────────────────────────────────────

function ConfirmDialog({
  isOpen,
  newCount,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  newCount: number
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
        className="bg-card rounded-2xl border border-border/30 p-6 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4 text-4xl">🔒</div>
        <h2 className="text-lg font-bold text-foreground mb-2 text-center">
          ¿Guardar predicciones?
        </h2>
        <p className="text-muted-foreground text-sm mb-1 text-center">
          Vas a guardar{" "}
          <strong className="text-foreground">{newCount} {newCount === 1 ? "predicción" : "predicciones"}</strong> nuevas.
        </p>
        <p className="text-amber-500 text-xs mb-5 text-center font-medium">
          ⚠️ Una vez guardadas, no podrán modificarse.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
          >
            Confirmar y bloquear
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Excel Upload ─────────────────────────────────────────────────────────────

function ExcelUploadSection({
  groupsWithMatches,
  onImport,
}: {
  groupsWithMatches: GroupWithMatches[]
  onImport: (predictions: Record<number, { home: number; away: number }>) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    try {
      const { parseExcelFile } = await import("@/lib/excel")
      const matchNumberToId = new Map(
        groupsWithMatches.flatMap((g) => g.matches.map((m) => [m.match_number, m.id])),
      )
      const parsed = await parseExcelFile(file, matchNumberToId)
      const count = Object.keys(parsed).length
      if (count === 0) {
        toast.error("No se encontraron predicciones válidas. Revisa que el archivo sea la plantilla correcta.")
      } else {
        onImport(parsed)
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
    const matches = groupsWithMatches.flatMap((g) =>
      g.matches.map((m) => ({
        match_number: m.match_number,
        home_name: m.home_team?.name ?? "?",
        away_name: m.away_team?.name ?? "?",
      })),
    )
    downloadTemplate(matches)
  }

  return (
    <div className="rounded-xl border border-border/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(99,102,241,0.06)", borderBottom: showInstructions ? "1px solid rgba(99,102,241,0.15)" : undefined }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Importar desde Excel</p>
            <p className="text-xs text-muted-foreground">Llena tus 72 predicciones de un jalón</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowInstructions((v) => !v)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"
        >
          {showInstructions ? "Ocultar" : "¿Cómo funciona?"}{" "}
          <span className="text-base leading-none">{showInstructions ? "▴" : "▾"}</span>
        </button>
      </div>

      {/* Instructions panel */}
      {showInstructions && (
        <div className="px-4 py-4 space-y-4 border-b border-border/20"
          style={{ background: "rgba(99,102,241,0.03)" }}>

          {/* Steps */}
          <ol className="space-y-2.5">
            {[
              { n: "1", icon: "⬇️", text: <>Descarga la <strong className="text-foreground">plantilla de Excel</strong> con los 72 partidos ya cargados.</> },
              { n: "2", icon: "✏️", text: <>Rellena solo las columnas <strong className="text-foreground">Goles Local</strong> y <strong className="text-foreground">Goles Visitante</strong> con números enteros (0–99).</> },
              { n: "3", icon: "📂", text: <>Guarda el archivo y sube el <strong className="text-foreground">.xlsx</strong> con el botón de abajo.</> },
              { n: "4", icon: "👀", text: <>Los marcadores aparecerán en el formulario. <strong className="text-foreground">Revísalos</strong> y luego haz clic en "Guardar".</> },
            ].map(({ n, icon, text }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                  {n}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  <span className="mr-1">{icon}</span>{text}
                </span>
              </li>
            ))}
          </ol>

          {/* Column reference table */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Formato de la plantilla
            </p>
            <div className="overflow-hidden rounded-lg border border-border/30">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Col A — #", "Col B — Local", "Col C — Visitante", "Col D — Goles Local ✏️", "Col E — Goles Visitante ✏️"].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-semibold text-muted-foreground border-b border-border/20"
                        style={h.includes("✏️") ? { color: "#a5b4fc" } : undefined}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1", "México", "Islandia", "2", "0"],
                    ["2", "Ecuador", "Mali", "1", "1"],
                    ["3", "EUA", "Serbia", "", ""],
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1.5 border-b border-border/10 font-mono"
                          style={{ color: j >= 3 ? (cell ? "#a5b4fc" : "#374151") : "#94a3b8" }}>
                          {cell || <span className="opacity-30">–</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              💡 Las columnas A, B y C ya vienen llenas. Solo escribe en D y E.
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 px-3 py-2.5"
            style={{ background: "rgba(245,158,11,0.05)" }}>
            <span className="text-sm shrink-0">⚠️</span>
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              La importación <strong>no guarda</strong> automáticamente. Después de importar, haz clic en
              <strong> "Guardar todas las predicciones"</strong> para confirmar y bloquearlas.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border/30 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          ⬇️ Descargar plantilla
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-50"
          style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderColor: "rgba(99,102,241,0.3)" }}
        >
          {isLoading ? (
            <><span className="animate-spin">⟳</span> Importando...</>
          ) : (
            <>📂 Subir archivo .xlsx</>
          )}
        </button>
      </div>
    </div>
  )
}

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
  match: GroupWithMatches["matches"][number]
  disabled: boolean
  importedHome?: number
  importedAway?: number
  importKey: number
}) {
  const pred = match.prediction
  const hasResult = match.home_score !== null && match.away_score !== null
  const isLocked = !!pred

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-colors",
      isLocked ? "border-border/30 bg-foreground/[0.02]" : "border-border/10 bg-transparent",
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
        {isLocked && !hasResult && (
          <span className="text-xs text-muted-foreground">🔒 bloqueado</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 text-right">
          <span className="text-base mr-1">{match.home_team?.flag_emoji}</span>
          <span className="text-sm font-medium text-foreground">{match.home_team?.name}</span>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-2 shrink-0">
          <ScoreInput
            key={`${match.id}_home_${importKey}`}
            name={`prediction_${match.id}_home`}
            defaultValue={pred?.predicted_home_score ?? importedHome}
            disabled={disabled || isLocked}
          />
          <span className="text-muted-foreground font-bold text-lg">—</span>
          <ScoreInput
            key={`${match.id}_away_${importKey}`}
            name={`prediction_${match.id}_away`}
            defaultValue={pred?.predicted_away_score ?? importedAway}
            disabled={disabled || isLocked}
          />
        </div>

        {/* Away team */}
        <div className="flex-1 text-left">
          <span className="text-sm font-medium text-foreground">{match.away_team?.name}</span>
          <span className="text-base ml-1">{match.away_team?.flag_emoji}</span>
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
}: {
  group: GroupWithMatches
  disabled: boolean
  importedPredictions: Record<number, { home: number; away: number }>
  importKey: number
}) {
  const predicted = group.matches.filter((m) => m.prediction).length
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
            style={{ background: "rgba(254,204,2,0.2)", color: "#fecc02", border: "1px solid rgba(254,204,2,0.3)" }}
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
  predictionMap,
  bonusPrediction,
  allTeams,
  isClosed,
}: {
  groupsWithMatches: GroupWithMatches[]
  predictionMap: Record<number, Prediction>
  bonusPrediction: BonusPrediction | null
  allTeams: Team[]
  isClosed: boolean
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
  const [newPredCount, setNewPredCount] = useState(0)
  const [importedPredictions, setImportedPredictions] = useState<Record<number, { home: number; away: number }>>({})
  const [importKey, setImportKey] = useState(0)

  function countNewPredictions(fd: FormData): number {
    let count = 0
    for (const group of groupsWithMatches) {
      for (const match of group.matches) {
        if (predictionMap[match.id]) continue
        const home = fd.get(`prediction_${match.id}_home`)
        const away = fd.get(`prediction_${match.id}_away`)
        if (home !== null && home !== "" && away !== null && away !== "") count++
      }
    }
    return count
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const count = countNewPredictions(fd)
    if (count === 0) {
      toast.info("No hay predicciones nuevas que guardar")
      return
    }
    setNewPredCount(count)
    setPendingFormData(fd)
    setConfirmOpen(true)
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
        newCount={newPredCount}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Bonus section */}
      <BonusSection allTeams={allTeams} bonus={bonusPrediction} disabled={isClosed} />

      {/* Progress bar + Excel tools */}
      {!isClosed && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(totalPredicted / 72) * 100}%`,
                  background: "linear-gradient(90deg, #8b1a2f, #fecc02)",
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground shrink-0 font-mono">
              {totalPredicted}/72
            </span>
          </div>
          <ExcelUploadSection
            groupsWithMatches={groupsWithMatches}
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
          />
        ))}

        {!isClosed && (
          <div className="sticky bottom-4">
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="w-full font-bold shadow-2xl"
              style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
            >
              {isPending ? "Guardando..." : "💾 Guardar todas las predicciones"}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
