import { read, utils, write } from "xlsx"

export function parseExcelFile(
  file: File,
  matchNumberToMatchId: Map<number, number>,
): Promise<Record<number, { home: number; away: number }>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = read(data, { type: "binary" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][]

        const result: Record<number, { home: number; away: number }> = {}
        for (const row of rows) {
          const matchNum = Number(row[0])
          const home = Number(row[3])
          const away = Number(row[4])
          if (!Number.isInteger(matchNum) || matchNum < 1) continue
          if (!Number.isFinite(home) || !Number.isFinite(away)) continue
          if (home < 0 || home > 99 || away < 0 || away > 99) continue
          const matchId = matchNumberToMatchId.get(matchNum)
          if (!matchId) continue
          result[matchId] = { home: Math.floor(home), away: Math.floor(away) }
        }
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

export function downloadTemplate(
  matches: { match_number: number; home_name: string; away_name: string }[],
) {
  const rows: (string | number)[][] = [
    ["#", "Local", "Visitante", "Goles Local", "Goles Visitante"],
    ...matches.map((m) => [m.match_number, m.home_name, m.away_name, "", ""]),
  ]
  const ws = utils.aoa_to_sheet(rows)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, "Predicciones")
  const buffer = write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer
  const blob = new Blob([buffer], { type: "application/octet-stream" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "plantilla-predicciones.xlsx"
  a.click()
  URL.revokeObjectURL(url)
}
