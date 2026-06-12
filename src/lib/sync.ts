"use server"

import { createServiceClient } from "@/lib/supabase/server"

// ESPN English display names → Spanish names in our DB
const ESPN_TO_DB: Record<string, string> = {
  "Mexico": "México",
  "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur",
  "Czechia": "Chequia",
  "Czech Republic": "Chequia",
  "Canada": "Canadá",
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "Brazil": "Brasil",
  "Morocco": "Marruecos",
  "United States": "Estados Unidos",
  "Germany": "Alemania",
  "Curaçao": "Curazao",
  "Curacao": "Curazao",
  "Netherlands": "Países Bajos",
  "Japan": "Japón",
  "Belgium": "Bélgica",
  "Egypt": "Egipto",
  "Spain": "España",
  "Cape Verde": "Cabo Verde",
  "France": "Francia",
  "Algeria": "Argelia",
  "DR Congo": "Congo RD",
  "Congo DR": "Congo RD",
  "England": "Inglaterra",
  "Croatia": "Croacia",
  "Saudi Arabia": "Arabia Saudita",
  "Australia": "Australia",
  "Austria": "Austria",
  "Colombia": "Colombia",
  "Ivory Coast": "Costa de Marfil",
  "Côte d'Ivoire": "Costa de Marfil",
  "Ecuador": "Ecuador",
  "Ghana": "Ghana",
  "Haiti": "Haití",
  "Iraq": "Iraq",
  "Iran": "Irán",
  "Jordan": "Jordania",
  "Norway": "Noruega",
  "New Zealand": "Nueva Zelanda",
  "Panama": "Panamá",
  "Qatar": "Qatar",
  "Senegal": "Senegal",
  "Argentina": "Argentina",
  "Paraguay": "Paraguay",
  "Portugal": "Portugal",
  "Sweden": "Suecia",
  "Switzerland": "Suiza",
  "Turkey": "Turquía",
  "Tunisia": "Túnez",
  "Uruguay": "Uruguay",
  "Uzbekistan": "Uzbekistán",
}

function toDbName(espnName: string): string {
  return ESPN_TO_DB[espnName] ?? espnName
}

export async function syncTodayResults(): Promise<{
  updated: number
  skipped: number
  unmatched: string[]
  errors: string[]
}> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")

  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`,
    { cache: "no-store" },
  )
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  const events: unknown[] = data.events ?? []

  const service = createServiceClient()
  const { data: teams } = await service.from("teams").select("id, name")
  const teamByName = new Map<string, number>(teams?.map((t) => [t.name, t.id]) ?? [])

  let updated = 0
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

    // Find match regardless of home/away order in our DB
    const { data: match } = await service
      .from("matches")
      .select("id, home_team_id, away_team_id, home_score, away_score, status")
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
    } else {
      updated++
    }
  }

  return { updated, skipped, unmatched, errors }
}
