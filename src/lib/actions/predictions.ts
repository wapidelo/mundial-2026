"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const PredictionSchema = z.object({
  match_id: z.coerce.number().int().positive(),
  predicted_home_score: z.coerce.number().int().min(0).max(99),
  predicted_away_score: z.coerce.number().int().min(0).max(99),
})

export async function savePredictions(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const tournamentStart = new Date(process.env.TOURNAMENT_START ?? "2026-06-11T19:00:00Z")
  if (new Date() >= tournamentStart) {
    throw new Error("Las predicciones están cerradas")
  }

  // Parse all predictions from formData
  // Expected fields: prediction_<matchId>_home and prediction_<matchId>_away
  const predictionsToUpsert: { user_id: string; match_id: number; predicted_home_score: number; predicted_away_score: number }[] = []

  const entries = Array.from(formData.entries())
  const matchIds = new Set<number>()

  for (const [key] of entries) {
    const homeMatch = key.match(/^prediction_(\d+)_home$/)
    if (homeMatch) matchIds.add(parseInt(homeMatch[1]))
  }

  for (const matchId of matchIds) {
    const homeRaw = formData.get(`prediction_${matchId}_home`)
    const awayRaw = formData.get(`prediction_${matchId}_away`)
    if (homeRaw === null || homeRaw === "" || awayRaw === null || awayRaw === "") continue

    const parsed = PredictionSchema.safeParse({
      match_id: matchId,
      predicted_home_score: homeRaw,
      predicted_away_score: awayRaw,
    })
    if (!parsed.success) continue

    predictionsToUpsert.push({
      user_id: user.id,
      match_id: parsed.data.match_id,
      predicted_home_score: parsed.data.predicted_home_score,
      predicted_away_score: parsed.data.predicted_away_score,
    })
  }

  if (predictionsToUpsert.length === 0) return { ok: true }

  const { error } = await supabase
    .from("predictions")
    .upsert(predictionsToUpsert, { onConflict: "user_id,match_id", ignoreDuplicates: true })

  if (error) throw new Error(error.message)

  revalidatePath("/predictions")
  revalidatePath("/leaderboard")
  return { ok: true }
}

export async function saveBonusPredictions(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const tournamentStart = new Date(process.env.TOURNAMENT_START ?? "2026-06-11T19:00:00Z")
  if (new Date() >= tournamentStart) {
    throw new Error("Las predicciones están cerradas")
  }

  const championId = formData.get("champion_team_id")
  const thirdId = formData.get("third_place_team_id")

  const { error } = await supabase
    .from("bonus_predictions")
    .upsert(
      {
        user_id: user.id,
        champion_team_id: championId ? parseInt(championId as string) : null,
        third_place_team_id: thirdId ? parseInt(thirdId as string) : null,
      },
      { onConflict: "user_id" },
    )

  if (error) throw new Error(error.message)

  revalidatePath("/predictions")
  return { ok: true }
}
