"use client"

import { useState } from "react"
import { toggleUserActive, updateUserDisplayName } from "@/lib/actions/admin"
import { toast } from "sonner"

type User = {
  id: string
  display_name: string
  active: boolean
  created_at: string
  email: string
}

export function AdminUserRow({ user: u }: { user: User }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(u.display_name)
  const [saving, setSaving] = useState(false)

  const initials = name.charAt(0).toUpperCase()
  const joinedAt = new Date(u.created_at).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
  })

  async function handleNameSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (name.trim() === u.display_name) { setEditing(false); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set("user_id", u.id)
      fd.set("display_name", name.trim())
      await updateUserDisplayName(fd)
      toast.success("Nombre actualizado")
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ opacity: u.active ? 1 : 0.5 }}>
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{
          background: u.active
            ? "linear-gradient(135deg, #8b1a2f, #c0392b)"
            : "linear-gradient(135deg, #374151, #4b5563)",
        }}
      >
        {initials}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <form onSubmit={handleNameSave} className="flex items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm font-medium bg-white/5 border border-white/20 rounded-lg px-2 py-0.5 text-foreground w-40 focus:outline-none focus:border-yellow-500/50"
              onKeyDown={(e) => { if (e.key === "Escape") { setName(u.display_name); setEditing(false) } }}
            />
            <button
              type="submit"
              disabled={saving}
              className="text-xs px-2 py-1 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/25 transition-colors"
            >
              {saving ? "…" : "✓"}
            </button>
            <button
              type="button"
              onClick={() => { setName(u.display_name); setEditing(false) }}
              className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-foreground hover:text-yellow-400 transition-colors flex items-center gap-1 group"
            title="Editar nombre"
          >
            {name}
            <span className="text-muted-foreground/40 group-hover:text-yellow-400/60 text-[10px] transition-colors">✏️</span>
          </button>
        )}
        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
      </div>

      {/* Join date */}
      <span className="hidden sm:block text-xs text-muted-foreground shrink-0">{joinedAt}</span>

      {/* Status badge */}
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
        style={
          u.active
            ? { background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }
            : { background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }
        }
      >
        {u.active ? "Activo" : "Inactivo"}
      </span>

      {/* Activate/deactivate */}
      <form action={toggleUserActive}>
        <input type="hidden" name="user_id" value={u.id} />
        <input type="hidden" name="active" value={u.active ? "false" : "true"} />
        <button
          type="submit"
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0"
          style={
            u.active
              ? { borderColor: "rgba(248,113,113,0.3)", color: "#f87171", background: "rgba(248,113,113,0.06)" }
              : { borderColor: "rgba(52,211,153,0.3)", color: "#34d399", background: "rgba(52,211,153,0.06)" }
          }
        >
          {u.active ? "Desactivar" : "Activar"}
        </button>
      </form>
    </div>
  )
}
