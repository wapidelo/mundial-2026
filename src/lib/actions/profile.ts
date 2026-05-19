"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function checkEmailExists(
  email: string,
): Promise<{ exists: boolean; name?: string }> {
  const service = createServiceClient()
  const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 500 })
  if (error) throw error

  const user = data.users.find((u) => u.email === email)
  if (!user) return { exists: false }

  const { data: profile } = await service
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  return { exists: true, name: profile?.display_name }
}

export async function updateDisplayName(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const name = (formData.get("display_name") as string)?.trim()
  if (!name || name.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres")
  if (name.length > 40) throw new Error("El nombre es demasiado largo")

  const service = createServiceClient()
  const { error } = await service
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/", "layout")
}
