"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { updateDisplayName } from "@/lib/actions/profile"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function ProfileModal({
  currentName,
  open,
  onClose,
}: {
  currentName: string
  open: boolean
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDisplayName(new FormData(e.currentTarget))
      toast.success("Nombre actualizado")
      router.refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 p-6"
        style={{ background: "rgba(10,15,30,0.97)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground mb-1">Editar nombre</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Tu nombre aparece en el marcador y en los correos de notificación.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-slate-300 text-sm">
              Nombre
            </Label>
            <Input
              ref={inputRef}
              id="display_name"
              name="display_name"
              defaultValue={currentName}
              minLength={2}
              maxLength={40}
              required
              autoFocus
              className="bg-white/5 border-white/15 text-white placeholder:text-slate-600 focus:border-red-700 h-11"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
