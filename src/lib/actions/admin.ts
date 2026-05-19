"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { CHAMPION_POINTS, THIRD_PLACE_POINTS } from "@/lib/scoring"

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("No autorizado")
  }
}

const ResultSchema = z.object({
  match_id: z.coerce.number().int().positive(),
  home_score: z.coerce.number().int().min(0).max(99),
  away_score: z.coerce.number().int().min(0).max(99),
})

export async function setMatchResult(formData: FormData) {
  await assertAdmin()
  const parsed = ResultSchema.safeParse({
    match_id: formData.get("match_id"),
    home_score: formData.get("home_score"),
    away_score: formData.get("away_score"),
  })
  if (!parsed.success) throw new Error("Datos inválidos")

  const service = createServiceClient()
  const { error } = await service
    .from("matches")
    .update({
      home_score: parsed.data.home_score,
      away_score: parsed.data.away_score,
      status: "finished",
    })
    .eq("id", parsed.data.match_id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/matches")
  revalidatePath("/matches")
  revalidatePath("/leaderboard")
}

const BonusResultSchema = z.object({
  team_id: z.coerce.number().int().positive(),
  type: z.enum(["champion", "third_place"]),
})

export async function setBonusResult(formData: FormData) {
  await assertAdmin()
  const parsed = BonusResultSchema.safeParse({
    team_id: formData.get("team_id"),
    type: formData.get("type"),
  })
  if (!parsed.success) throw new Error("Datos inválidos")

  const service = createServiceClient()

  if (parsed.data.type === "champion") {
    // Reset all champion points first, then award to correct predictors
    await service
      .from("bonus_predictions")
      .update({ champion_points: 0 })
      .neq("user_id", "00000000-0000-0000-0000-000000000000")

    const { error } = await service
      .from("bonus_predictions")
      .update({ champion_points: CHAMPION_POINTS })
      .eq("champion_team_id", parsed.data.team_id)

    if (error) throw new Error(error.message)
  } else {
    await service
      .from("bonus_predictions")
      .update({ third_place_points: 0 })
      .neq("user_id", "00000000-0000-0000-0000-000000000000")

    const { error } = await service
      .from("bonus_predictions")
      .update({ third_place_points: THIRD_PLACE_POINTS })
      .eq("third_place_team_id", parsed.data.team_id)

    if (error) throw new Error(error.message)
  }

  revalidatePath("/admin/matches")
  revalidatePath("/leaderboard")
}
