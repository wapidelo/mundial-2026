import { NextResponse } from "next/server"
import { toDbName } from "@/lib/espn-names"

export const dynamic = "force-dynamic"

export async function GET() {
  const now = new Date()
  const dateStrs = [0, 1, 2].map((daysAgo) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10).replace(/-/g, "")
  })

  const responses = await Promise.all(
    dateStrs.map((d) =>
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${d}`, {
        cache: "no-store",
      }),
    ),
  )

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

  const live = []

  for (const event of events) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = event as any
    const competition = e.competitions?.[0]
    if (!competition) continue

    const status = competition.status
    const state: string = status?.type?.state ?? "pre"
    if (state !== "in") continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const competitors: any[] = competition.competitors ?? []
    const espnHome = competitors.find((c) => c.homeAway === "home")
    const espnAway = competitors.find((c) => c.homeAway === "away")
    if (!espnHome || !espnAway) continue

    const statusName: string = status?.type?.name ?? ""
    const isHalfTime = statusName === "STATUS_HALFTIME"

    live.push({
      homeTeam: toDbName(espnHome.team?.displayName ?? espnHome.team?.name ?? ""),
      awayTeam: toDbName(espnAway.team?.displayName ?? espnAway.team?.name ?? ""),
      homeScore: parseInt(espnHome.score ?? "0", 10),
      awayScore: parseInt(espnAway.score ?? "0", 10),
      clock: (status?.displayClock ?? "") as string,
      period: (status?.period ?? 1) as number,
      isHalfTime,
    })
  }

  return NextResponse.json({ matches: live })
}
