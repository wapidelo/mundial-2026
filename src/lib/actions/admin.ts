"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { CHAMPION_POINTS, THIRD_PLACE_POINTS } from "@/lib/scoring"
import { sendMatchResultEmails } from "@/lib/email"

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

  // Fire-and-forget: notify all users who predicted this match (non-blocking)
  const matchId = parsed.data.match_id
  const homeScore = parsed.data.home_score
  const awayScore = parsed.data.away_score
  ;(async () => {
    try {
      const { data: match } = await service
        .from("matches")
        .select("match_number, home_team:teams!home_team_id(name,flag_emoji), away_team:teams!away_team_id(name,flag_emoji)")
        .eq("id", matchId)
        .single()

      if (!match) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = match as any
      await sendMatchResultEmails(matchId, {
        matchNumber: m.match_number,
        homeTeam: m.home_team?.name ?? "Local",
        homeFlag: m.home_team?.flag_emoji ?? "🏳️",
        awayTeam: m.away_team?.name ?? "Visitante",
        awayFlag: m.away_team?.flag_emoji ?? "🏳️",
        homeScore,
        awayScore,
      })
    } catch (err) {
      console.error("[match-result-email]", err)
    }
  })()
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

const AssignTeamSchema = z.object({
  match_id: z.coerce.number().int().positive(),
  side: z.enum(["home", "away"]),
  team_id: z.coerce.number().int().positive(),
})

export async function assignTeamToMatch(formData: FormData) {
  await assertAdmin()
  const parsed = AssignTeamSchema.parse({
    match_id: formData.get("match_id"),
    side: formData.get("side"),
    team_id: formData.get("team_id"),
  })

  const service = createServiceClient()
  const update = parsed.side === "home"
    ? { home_team_id: parsed.team_id }
    : { away_team_id: parsed.team_id }

  const { error } = await service
    .from("matches")
    .update(update)
    .eq("id", parsed.match_id)
    .neq("round", "group")

  if (error) throw new Error(error.message)

  revalidatePath("/admin/matches")
  revalidatePath("/matches")
  revalidatePath("/predictions")
}
