import { Resend } from "resend"
import { createServiceClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.FROM_EMAIL!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mundial-2026-pucci.vercel.app"
const RATE_LIMIT_MINUTES = 60

// ─── Shared types (exported for /recibo page) ─────────────────────────────────

export type PredictionSnapshotItem = {
  match_number: number
  home_label: string
  away_label: string
  home_flag: string
  away_flag: string
  predicted_home: number
  predicted_away: number
  round: string
}

export type BonusSnapshot = {
  champion_name: string | null
  champion_flag: string | null
  third_place_name: string | null
  third_place_flag: string | null
}

export type MatchResultEmailData = {
  matchNumber: number
  homeTeam: string
  homeFlag: string
  awayTeam: string
  awayFlag: string
  homeScore: number
  awayScore: number
}

// ─── Rate-limit check ─────────────────────────────────────────────────────────

export async function shouldSendReceiptEmail(userId: string): Promise<boolean> {
  const service = createServiceClient()
  const { data } = await service
    .from("prediction_receipts")
    .select("last_sent_at")
    .eq("user_id", userId)
    .single()

  if (!data?.last_sent_at) return true
  const minutesSince = (Date.now() - new Date(data.last_sent_at).getTime()) / 60_000
  return minutesSince >= RATE_LIMIT_MINUTES
}

// ─── Receipt upsert + email ───────────────────────────────────────────────────

export async function upsertAndSendReceipt(
  userId: string,
  displayName: string,
  userEmail: string,
  predictions: PredictionSnapshotItem[],
  bonus: BonusSnapshot | null,
  sendEmail: boolean,
): Promise<void> {
  const service = createServiceClient()

  const { data: receipt, error } = await service
    .from("prediction_receipts")
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
        predictions_snapshot: predictions,
        bonus_snapshot: bonus,
        ...(sendEmail ? { last_sent_at: new Date().toISOString() } : {}),
      },
      { onConflict: "user_id" },
    )
    .select("token")
    .single()

  if (error || !receipt) {
    console.error("[email] receipt upsert failed", error)
    return
  }

  if (!sendEmail) return

  const receiptUrl = `${APP_URL}/recibo/${receipt.token}`
  const verificationCode = (receipt.token as string).slice(0, 8).toUpperCase()
  const savedAt = new Date().toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "full",
    timeStyle: "short",
  })

  const { error: emailError } = await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `✅ Quiniela guardada — ${predictions.length} predicciones confirmadas`,
    html: buildReceiptHtml({ displayName, predictions, bonus, receiptUrl, verificationCode, savedAt }),
  })

  if (emailError) console.error("[email] receipt send failed", emailError)
}

// ─── Match result notifications ───────────────────────────────────────────────

export async function sendMatchResultEmails(
  matchId: number,
  matchData: MatchResultEmailData,
): Promise<void> {
  const service = createServiceClient()

  const { data: preds } = await service
    .from("predictions")
    .select("user_id, predicted_home_score, predicted_away_score, points, profiles(display_name)")
    .eq("match_id", matchId)

  if (!preds || preds.length === 0) return

  const userIds = preds.map((p) => p.user_id)
  const { data: authData } = await service.auth.admin.listUsers({ perPage: 1000, page: 1 })
  const emailMap = new Map(
    (authData?.users ?? [])
      .filter((u) => userIds.includes(u.id))
      .map((u) => [u.id, u.email ?? null]),
  )

  const sends = preds.flatMap((p) => {
    const email = emailMap.get(p.user_id)
    if (!email) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const displayName = (p.profiles as any)?.display_name ?? email.split("@")[0]
    const pts = p.points ?? 0
    return [
      resend.emails.send({
        from: FROM,
        to: email,
        subject: `⚽ Resultado M${matchData.matchNumber}: ${matchData.homeTeam} ${matchData.homeScore}–${matchData.awayScore} ${matchData.awayTeam}`,
        html: buildMatchResultHtml({
          matchData,
          displayName,
          predictedHome: p.predicted_home_score,
          predictedAway: p.predicted_away_score,
          pts,
        }),
      }),
    ]
  })

  await Promise.allSettled(sends)
}

// ─── HTML: Receipt email ──────────────────────────────────────────────────────

function buildReceiptHtml(opts: {
  displayName: string
  predictions: PredictionSnapshotItem[]
  bonus: BonusSnapshot | null
  receiptUrl: string
  verificationCode: string
  savedAt: string
}): string {
  const { displayName, predictions, bonus, receiptUrl, verificationCode, savedAt } = opts
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptUrl)}&bgcolor=111827&color=fecc02&margin=10`

  const predRows = predictions
    .map(
      (p) => `
    <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
      <td style="padding:5px 8px;font-family:monospace;font-size:11px;color:#475569">#${p.match_number}</td>
      <td style="padding:5px 8px;font-size:12px;color:#94a3b8">${p.home_flag} ${p.home_label}</td>
      <td style="padding:5px 10px;text-align:center;font-family:monospace;font-weight:900;font-size:13px;color:#fecc02">${p.predicted_home}–${p.predicted_away}</td>
      <td style="padding:5px 8px;font-size:12px;color:#94a3b8">${p.away_flag} ${p.away_label}</td>
    </tr>`,
    )
    .join("")

  const bonusRow =
    bonus && (bonus.champion_name || bonus.third_place_name)
      ? `<tr><td colspan="4" style="padding:8px 10px;background:rgba(254,204,2,0.06);border-top:1px solid rgba(254,204,2,0.15)">
          <span style="font-size:12px;color:#fecc02">🏆 Campeón: ${bonus.champion_flag ?? ""} ${bonus.champion_name ?? "—"}</span>&nbsp;&nbsp;
          <span style="font-size:12px;color:#94a3b8">🥉 3er lugar: ${bonus.third_place_flag ?? ""} ${bonus.third_place_name ?? "—"}</span>
        </td></tr>`
      : ""

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;color:#0a0f1e">Quiniela guardada — ${predictions.length} predicciones ✅</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0f1e">
<tr><td align="center" style="padding:40px 16px">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden">
  <tr><td style="background:linear-gradient(90deg,#8b1a2f,#1a1060,#8b1a2f);height:5px;font-size:0">&nbsp;</td></tr>
  <tr><td align="center" style="padding:32px 40px 20px">
    <div style="font-size:48px;line-height:1;margin-bottom:12px">⚽</div>
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#fff">¡Quiniela guardada!</h1>
    <p style="margin:0;font-size:14px;font-weight:700;color:#fecc02;letter-spacing:.1em">MUNDIAL 2026</p>
    <p style="margin:8px 0 0;font-size:13px;color:#64748b">Hola, <strong style="color:#94a3b8">${displayName}</strong></p>
  </td></tr>
  <tr><td style="padding:0 40px 24px">
    <div style="background:rgba(254,204,2,0.06);border:1px solid rgba(254,204,2,0.2);border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between">
      <div>
        <p style="margin:0 0 3px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px">Código de verificación</p>
        <p style="margin:0;font-size:24px;font-weight:900;font-family:monospace;color:#fecc02;letter-spacing:4px">${verificationCode}</p>
      </div>
      <div style="text-align:right">
        <p style="margin:0 0 3px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px">Guardado el</p>
        <p style="margin:0;font-size:11px;color:#94a3b8">${savedAt}</p>
      </div>
    </div>
  </td></tr>
  <tr><td style="padding:0 40px 8px">
    <p style="margin:0 0 8px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px">Tus ${predictions.length} predicciones</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden">
      ${predRows}
      ${bonusRow}
    </table>
  </td></tr>
  <tr><td align="center" style="padding:24px 40px">
    <p style="margin:0 0 12px;font-size:12px;color:#475569">Verifica este recibo en cualquier momento</p>
    <a href="${receiptUrl}">
      <img src="${qrUrl}" width="130" height="130" alt="QR" style="border-radius:8px;border:2px solid rgba(254,204,2,0.3);display:block;margin:0 auto"/>
    </a>
    <p style="margin:10px 0 0;font-size:10px;color:#334155;word-break:break-all;font-family:monospace">${receiptUrl}</p>
  </td></tr>
  <tr><td style="background:rgba(0,0,0,0.3);padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05)">
    <p style="margin:0;font-size:12px;color:#1e293b;text-align:center">Quiniela Mundial 2026 · 11 Jun – 19 Jul 2026</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── HTML: Match result email ─────────────────────────────────────────────────

function buildMatchResultHtml(opts: {
  matchData: MatchResultEmailData
  displayName: string
  predictedHome: number
  predictedAway: number
  pts: number
}): string {
  const { matchData, displayName, predictedHome, predictedAway, pts } = opts
  const badge =
    pts === 3
      ? { label: "¡Exacto! +3 pts", color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)" }
      : pts === 2
        ? { label: "Ganador correcto +2 pts", color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.3)" }
        : pts === 1
          ? { label: "Empate correcto +1 pt", color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.3)" }
          : { label: "Sin puntos esta vez", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" }

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0f1e">
<tr><td align="center" style="padding:40px 16px">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden">
  <tr><td style="background:linear-gradient(90deg,#8b1a2f,#1a1060,#8b1a2f);height:5px;font-size:0">&nbsp;</td></tr>
  <tr><td align="center" style="padding:28px 40px 20px">
    <div style="font-size:40px;margin-bottom:8px">⚽</div>
    <h1 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#fff">Resultado Partido #${matchData.matchNumber}</h1>
    <p style="margin:0;font-size:13px;color:#64748b">Hola, <strong style="color:#94a3b8">${displayName}</strong></p>
  </td></tr>
  <tr><td style="padding:0 40px 20px">
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center">
      <p style="margin:0 0 10px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px">Resultado final</p>
      <p style="margin:0;font-size:30px;font-weight:900;color:#fff;font-family:monospace">
        ${matchData.homeFlag} ${matchData.homeScore} – ${matchData.awayScore} ${matchData.awayFlag}
      </p>
      <p style="margin:6px 0 0;font-size:13px;color:#94a3b8">${matchData.homeTeam} vs ${matchData.awayTeam}</p>
    </div>
  </td></tr>
  <tr><td style="padding:0 40px 32px">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="48%" style="padding:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:10px;text-align:center">
          <p style="margin:0 0 6px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px">Tu predicción</p>
          <p style="margin:0;font-size:24px;font-weight:900;font-family:monospace;color:#94a3b8">${predictedHome}–${predictedAway}</p>
        </td>
        <td width="4%">&nbsp;</td>
        <td width="48%" style="padding:14px;background:${badge.bg};border:1px solid ${badge.border};border-radius:10px;text-align:center">
          <p style="margin:0 0 6px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px">Resultado</p>
          <p style="margin:0;font-size:15px;font-weight:800;color:${badge.color}">${badge.label}</p>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="background:rgba(0,0,0,0.3);padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05)">
    <p style="margin:0;font-size:12px;color:#1e293b;text-align:center">Quiniela Mundial 2026 · 11 Jun – 19 Jul 2026</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
