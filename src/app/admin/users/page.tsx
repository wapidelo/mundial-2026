import { createServiceClient } from "@/lib/supabase/server"
import { AdminUserRow } from "./user-row"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const service = createServiceClient()

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Participantes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} activos · {users.length - activeCount} inactivos · {users.length} total
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/20 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/10 bg-foreground/[0.02]">
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
          {users.map((u) => (
            <AdminUserRow key={u.id} user={u} />
          ))}
        </div>
      </div>
    </div>
  )
}
