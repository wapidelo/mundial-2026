"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { shouldSendReceiptEmail, upsertAndSendReceipt } from "@/lib/email"
import type { PredictionSnapshotItem, BonusSnapshot } from "@/lib/email"

const PredictionSchema = z.object({
  match_id: z.coerce.number().int().positive(),
  predicted_home_score: z.coerce.number().int().min(0).max(99),
  predicted_away_score: z.coerce.number().int().min(0).max(99),
})

export async function savePredictions(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: profile } = await supabase.from("profiles").select("active").eq("id", user.id).single()
  if (!profile?.active) throw new Error("Tu cuenta no está activa en esta quiniela")

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

  // Fire-and-forget: generate/update receipt and send email (non-blocking)
  const capturedUserId = user.id
  ;(async () => {
    try {
      const service = createServiceClient()
      const { data: authUser } = await service.auth.admin.getUserById(capturedUserId)
      const userEmail = authUser?.user?.email
      if (!userEmail) return

      const { data: profile } = await service
        .from("profiles")
        .select("display_name")
        .eq("id", capturedUserId)
        .single()
      const displayName = profile?.display_name ?? userEmail.split("@")[0]

      const { data: allPreds } = await service
        .from("predictions")
        .select("predicted_home_score, predicted_away_score, matches(match_number, round, home_slot, away_slot, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji))")
        .eq("user_id", capturedUserId)

      const snapshot: PredictionSnapshotItem[] = (allPreds ?? []).map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = p.matches as any
        return {
          match_number: m?.match_number ?? 0,
          home_label: m?.home_team?.name ?? m?.home_slot ?? "TBD",
          away_label: m?.away_team?.name ?? m?.away_slot ?? "TBD",
          home_flag: m?.home_team?.flag_emoji ?? "🏳️",
          away_flag: m?.away_team?.flag_emoji ?? "🏳️",
          predicted_home: p.predicted_home_score,
          predicted_away: p.predicted_away_score,
          round: m?.round ?? "group",
        }
      }).sort((a, b) => a.match_number - b.match_number)

      const { data: bonusPred } = await service
        .from("bonus_predictions")
        .select("champion:teams!champion_team_id(name,flag_emoji), third_place:teams!third_place_team_id(name,flag_emoji)")
        .eq("user_id", capturedUserId)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bp = bonusPred as any
      const bonus: BonusSnapshot | null = bp
        ? {
            champion_name: bp.champion?.name ?? null,
            champion_flag: bp.champion?.flag_emoji ?? null,
            third_place_name: bp.third_place?.name ?? null,
            third_place_flag: bp.third_place?.flag_emoji ?? null,
          }
        : null

      const sendEmail = await shouldSendReceiptEmail(capturedUserId)
      await upsertAndSendReceipt(capturedUserId, displayName, userEmail, snapshot, bonus, sendEmail)
    } catch (err) {
      console.error("[receipt]", err)
    }
  })()

  return { ok: true }
}

export async function saveBonusPredictions(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: profile } = await supabase.from("profiles").select("active").eq("id", user.id).single()
  if (!profile?.active) throw new Error("Tu cuenta no está activa en esta quiniela")

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

  // Fire-and-forget: update receipt snapshot with new bonus (non-blocking)
  const capturedUserId = user.id
  ;(async () => {
    try {
      const service = createServiceClient()
      const { data: authUser } = await service.auth.admin.getUserById(capturedUserId)
      const userEmail = authUser?.user?.email
      if (!userEmail) return

      const { data: profile } = await service
        .from("profiles")
        .select("display_name")
        .eq("id", capturedUserId)
        .single()
      const displayName = profile?.display_name ?? userEmail.split("@")[0]

      const { data: allPreds } = await service
        .from("predictions")
        .select("predicted_home_score, predicted_away_score, matches(match_number, round, home_slot, away_slot, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji))")
        .eq("user_id", capturedUserId)

      const snapshot: PredictionSnapshotItem[] = (allPreds ?? []).map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = p.matches as any
        return {
          match_number: m?.match_number ?? 0,
          home_label: m?.home_team?.name ?? m?.home_slot ?? "TBD",
          away_label: m?.away_team?.name ?? m?.away_slot ?? "TBD",
          home_flag: m?.home_team?.flag_emoji ?? "🏳️",
          away_flag: m?.away_team?.flag_emoji ?? "🏳️",
          predicted_home: p.predicted_home_score,
          predicted_away: p.predicted_away_score,
          round: m?.round ?? "group",
        }
      }).sort((a, b) => a.match_number - b.match_number)

      const { data: bonusPred } = await service
        .from("bonus_predictions")
        .select("champion:teams!champion_team_id(name,flag_emoji), third_place:teams!third_place_team_id(name,flag_emoji)")
        .eq("user_id", capturedUserId)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bp = bonusPred as any
      const bonus: BonusSnapshot | null = bp
        ? {
            champion_name: bp.champion?.name ?? null,
            champion_flag: bp.champion?.flag_emoji ?? null,
            third_place_name: bp.third_place?.name ?? null,
            third_place_flag: bp.third_place?.flag_emoji ?? null,
          }
        : null

      const sendEmail = await shouldSendReceiptEmail(capturedUserId)
      await upsertAndSendReceipt(capturedUserId, displayName, userEmail, snapshot, bonus, sendEmail)
    } catch (err) {
      console.error("[receipt]", err)
    }
  })()

  return { ok: true }
}
