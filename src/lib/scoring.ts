export const CHAMPION_POINTS = 5
export const THIRD_PLACE_POINTS = 3
export const EXACT_SCORE_POINTS = 3
export const WINNER_POINTS = 2
export const DRAW_POINTS = 1

export function calculateMatchPoints(
  predicted: { home: number; away: number },
  actual: { home: number; away: number },
): number {
  if (predicted.home === actual.home && predicted.away === actual.away) {
    return EXACT_SCORE_POINTS
  }
  const predSign = Math.sign(predicted.home - predicted.away)
  const actualSign = Math.sign(actual.home - actual.away)
  if (predSign !== actualSign) return 0
  return actualSign !== 0 ? WINNER_POINTS : DRAW_POINTS
}

export function pointsLabel(points: number | null): string {
  if (points === null) return "Pendiente"
  if (points === 3) return "¡Exacto! +3 pts"
  if (points === 2) return "Ganador +2 pts"
  if (points === 1) return "Empate +1 pt"
  return "Sin puntos"
}

export function pointsColor(points: number | null): string {
  if (points === 3) return "text-emerald-400"
  if (points === 2) return "text-sky-400"
  if (points === 1) return "text-yellow-400"
  if (points === 0) return "text-red-400"
  return "text-muted-foreground"
}
