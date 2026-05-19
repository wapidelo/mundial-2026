import { createServiceClient } from "@/lib/supabase/server"
import { toggleUserActive } from "@/lib/actions/admin"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const service = createServiceClient()

  // Get all profiles + auth users in parallel
  const [{ data: profiles }, { data: authData }] = await Promise.all([
    service.from("profiles").select("id, display_name, active, created_at").order("created_at", { ascending: false }),
    service.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ])

  const emailMap = new Map(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? "—"]),
  )

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    active: p.active,
    created_at: p.created_at,
    email: emailMap.get(p.id) ?? "—",
  }))

  const activeCount = users.filter((u) => u.active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Participantes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} activos · {users.length - activeCount} inactivos · {users.length} total
          </p>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-border/20 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/10 bg-foreground/[0.02] flex items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            👥 {users.length} usuarios registrados
          </span>
        </div>

        <div className="divide-y divide-border/10">
          {users.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay usuarios registrados aún.
            </div>
          )}
          {users.map((u) => {
            const initials = u.display_name.charAt(0).toUpperCase()
            const joinedAt = new Date(u.created_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })

            return (
              <div
                key={u.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ opacity: u.active ? 1 : 0.5 }}
              >
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

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                {/* Join date */}
                <span className="hidden sm:block text-xs text-muted-foreground shrink-0">
                  {joinedAt}
                </span>

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

                {/* Toggle form */}
                <form action={toggleUserActive}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <input type="hidden" name="active" value={u.active ? "false" : "true"} />
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0"
                    style={
                      u.active
                        ? {
                            borderColor: "rgba(248,113,113,0.3)",
                            color: "#f87171",
                            background: "rgba(248,113,113,0.06)",
                          }
                        : {
                            borderColor: "rgba(52,211,153,0.3)",
                            color: "#34d399",
                            background: "rgba(52,211,153,0.06)",
                          }
                    }
                  >
                    {u.active ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
