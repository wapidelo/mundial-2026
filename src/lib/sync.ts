"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { toDbName } from "@/lib/espn-names"

export async function syncTodayResults(): Promise<{
  updated: number
  advanced: number
  skipped: number
  unmatched: string[]
  errors: string[]
}> {
  const now = new Date()
  // ESPN groups matches by US local date, which can be up to 2 UTC days behind.
  // Fetch the last 3 UTC days to guarantee no finished match is missed.
  const dateStrs = [0, 1, 2].map((daysAgo) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10).replace(/-/g, "")
  })

  const responses = await Promise.all(
    dateStrs.map((d) =>
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${d}`, { cache: "no-store" }),
    ),
  )
  if (!responses[0].ok) throw new Error(`ESPN API error: ${responses[0].status}`)

  const events: unknown[] = (
    await Promise.all(
      responses.map(async (r) => {
        if (!r.ok) return []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await r.json()
        return data.events ?? []
      }),
    )
  ).flat()

  const service = createServiceClient()
  const { data: teams } = await service.from("teams").select("id, name")
  const teamByName = new Map<string, number>(teams?.map((t) => [t.name, t.id]) ?? [])

  let updated = 0
  let advanced = 0
  let skipped = 0
  const unmatched: string[] = []
  const errors: string[] = []

  for (const event of events) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = event as any
    const competition = e.competitions?.[0]
    if (!competition) continue

    // Only process finished matches — ESPN uses STATUS_FULL_TIME, STATUS_FINAL,
    // STATUS_FINAL_AET, etc.; the `completed` flag covers them all
    const isCompleted: boolean = competition.status?.type?.completed === true
    if (!isCompleted) { skipped++; continue }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const competitors: any[] = competition.competitors ?? []
    const espnHome = competitors.find((c) => c.homeAway === "home")
    const espnAway = competitors.find((c) => c.homeAway === "away")
    if (!espnHome || !espnAway) continue

    const espnHomeName: string = espnHome.team?.displayName ?? espnHome.team?.name ?? ""
    const espnAwayName: string = espnAway.team?.displayName ?? espnAway.team?.name ?? ""
    const espnHomeScore = parseInt(espnHome.score ?? "0", 10)
    const espnAwayScore = parseInt(espnAway.score ?? "0", 10)

    const dbHomeName = toDbName(espnHomeName)
    const dbAwayName = toDbName(espnAwayName)

    const teamAId = teamByName.get(dbHomeName)
    const teamBId = teamByName.get(dbAwayName)

    if (!teamAId || !teamBId) {
      unmatched.push(`${espnHomeName} (→${dbHomeName}) vs ${espnAwayName} (→${dbAwayName})`)
      continue
    }

    // Include match_number and round so we can advance the bracket
    const { data: match } = await service
      .from("matches")
      .select("id, match_number, round, home_team_id, away_team_id, home_score, away_score, status")
      .or(
        `and(home_team_id.eq.${teamAId},away_team_id.eq.${teamBId}),and(home_team_id.eq.${teamBId},away_team_id.eq.${teamAId})`,
      )
      .single()

    if (!match) {
      unmatched.push(`DB match not found: ${dbHomeName} vs ${dbAwayName}`)
      continue
    }

    // Determine which ESPN score maps to our home/away
    const ourHomeIsEspnHome = match.home_team_id === teamAId
    const finalHomeScore = ourHomeIsEspnHome ? espnHomeScore : espnAwayScore
    const finalAwayScore = ourHomeIsEspnHome ? espnAwayScore : espnHomeScore

    // Skip if already up to date
    if (
      match.status === "finished" &&
      match.home_score === finalHomeScore &&
      match.away_score === finalAwayScore
    ) {
      skipped++
      continue
    }

    const { error } = await service
      .from("matches")
      .update({ home_score: finalHomeScore, away_score: finalAwayScore, status: "finished" })
      .eq("id", match.id)

    if (error) {
      errors.push(`Match ${match.id}: ${error.message}`)
      continue
    }

    updated++

    // ── Auto-avance de bracket para rondas eliminatorias ──────────────────────
    if (match.round !== "group" && match.home_team_id && match.away_team_id) {
      // ESPN sets competitor.winner = true on the winning team.
      // This handles draws resolved by AET/penalties correctly.
      // Fall back to score comparison only if the field is absent.
      const espnHomeWins: boolean =
        espnHome.winner === true ? true :
        espnAway.winner === true ? false :
        espnHomeScore > espnAwayScore

      // Map ESPN perspective (home/away) → our DB perspective
      const dbHomeWins = ourHomeIsEspnHome ? espnHomeWins : !espnHomeWins
      const winnerTeamId = dbHomeWins ? match.home_team_id : match.away_team_id
      const loserTeamId  = dbHomeWins ? match.away_team_id : match.home_team_id

      const winnerSlot = `W Partido ${match.match_number}`
      const loserSlot  = `L Partido ${match.match_number}` // solo para el partido de 3er lugar

      const advOps = await Promise.all([
        service.from("matches").update({ home_team_id: winnerTeamId }).eq("home_slot", winnerSlot),
        service.from("matches").update({ away_team_id: winnerTeamId }).eq("away_slot", winnerSlot),
        service.from("matches").update({ home_team_id: loserTeamId  }).eq("home_slot", loserSlot),
        service.from("matches").update({ away_team_id: loserTeamId  }).eq("away_slot", loserSlot),
      ])

      const advErrors = advOps.flatMap((r) => r.error ? [r.error.message] : [])
      if (advErrors.length) {
        errors.push(`Advance M${match.match_number}: ${advErrors.join(", ")}`)
      } else {
        advanced++
      }
    }
  }

  return { updated, advanced, skipped, unmatched, errors }
}
