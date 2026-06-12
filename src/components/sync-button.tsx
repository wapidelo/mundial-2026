"use client"

import { useState, useTransition } from "react"
import { syncResults } from "@/lib/actions/admin"

export function SyncButton() {
  const [isPending, startTransition] = useTransition()
  const [lastResult, setLastResult] = useState<{ updated: number; unmatched: string[] } | null>(null)

  function handleSync() {
    startTransition(async () => {
      const result = await syncResults()
      setLastResult(result)
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleSync}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 hover:brightness-110"
        style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
      >
        {isPending ? (
          <><span className="animate-spin inline-block">⟳</span> Sincronizando...</>
        ) : (
          <>🔄 Sincronizar resultados de hoy</>
        )}
      </button>

      {lastResult && !isPending && (
        <span className="text-xs font-mono">
          {lastResult.updated > 0 ? (
            <span className="text-emerald-400">✓ {lastResult.updated} partido{lastResult.updated !== 1 ? "s" : ""} actualizado{lastResult.updated !== 1 ? "s" : ""}</span>
          ) : (
            <span className="text-muted-foreground">Sin cambios</span>
          )}
          {lastResult.unmatched.length > 0 && (
            <span className="text-yellow-500 ml-2">⚠ {lastResult.unmatched.length} sin mapear</span>
          )}
        </span>
      )}
    </div>
  )
}
