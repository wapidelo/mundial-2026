"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { BracketMatch } from "@/app/(main)/bracket/page"
import type { RoundType } from "@/lib/types"

const CARD_H = 88
const CARD_W = 172
const COL_GAP = 40
const HEADER_H = 36
const TOTAL_H = 16 * CARD_H // 1408 — fixed by R32 match count

const ROUNDS: { key: RoundType; label: string; short: string }[] = [
  { key: "round_of_32", label: "Ronda de 32", short: "R32" },
  { key: "round_of_16", label: "Octavos", short: "R16" },
  { key: "quarter_final", label: "Cuartos", short: "QF" },
  { key: "semi_final", label: "Semis", short: "SF" },
  { key: "final", label: "Final", short: "🏆" },
]

// Returns the vertical center of a match card relative to the top of the card area (not including HEADER_H)
function getMatchCenterY(roundIndex: number, matchIndex: number): number {
  const mult = Math.pow(2, roundIndex)
  const paddingTop = ((mult - 1) * CARD_H) / 2
  const gap = (mult - 1) * CARD_H
  return paddingTop + matchIndex * (CARD_H + gap) + CARD_H / 2
}

function teamLabel(match: BracketMatch, side: "home" | "away") {
  const team = side === "home" ? match.home_team : match.away_team
  const slot = side === "home" ? match.home_slot : match.away_slot
  if (team) return { name: team.name, flag: team.flag_emoji, known: true }
  return { name: slot ?? "TBD", flag: "🏳️", known: false }
}

function MatchCard({ match, stretch = false }: { match: BracketMatch; stretch?: boolean }) {
  const home = teamLabel(match, "home")
  const away = teamLabel(match, "away")
  const isFinished = match.status === "finished"
  const date = new Date(match.scheduled_at)

  return (
    <div
      className={cn(
        "rounded-lg border border-border/20 overflow-hidden flex flex-col shrink-0",
        isFinished && "border-emerald-500/30",
        stretch && "w-full",
      )}
      style={{
        ...(stretch ? {} : { width: CARD_W }),
        height: CARD_H,
        background: "rgba(15,23,42,0.85)",
      }}
    >
      {/* Match header */}
      <div className="flex items-center justify-between px-2 py-[3px] border-b border-border/15">
        <span className="text-[9px] font-black font-mono text-primary/60">M{match.match_number}</span>
        <span className="text-[9px] text-muted-foreground/40 font-mono">
          {date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
        </span>
      </div>

      {/* Home team */}
      <div
        className={cn(
          "flex items-center justify-between px-2 flex-1 gap-1",
          isFinished && match.home_score! > match.away_score! && "bg-emerald-500/10",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs shrink-0">{home.flag}</span>
          <span
            className={cn(
              "text-[11px] truncate leading-tight",
              home.known ? "text-foreground font-medium" : "text-muted-foreground/40 italic",
            )}
          >
            {home.name}
          </span>
        </div>
        {isFinished && (
          <span className="text-xs font-black font-mono text-foreground shrink-0">{match.home_score}</span>
        )}
      </div>

      <div className="border-t border-border/10 mx-2" />

      {/* Away team */}
      <div
        className={cn(
          "flex items-center justify-between px-2 flex-1 gap-1",
          isFinished && match.away_score! > match.home_score! && "bg-emerald-500/10",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs shrink-0">{away.flag}</span>
          <span
            className={cn(
              "text-[11px] truncate leading-tight",
              away.known ? "text-foreground font-medium" : "text-muted-foreground/40 italic",
            )}
          >
            {away.name}
          </span>
        </div>
        {isFinished && (
          <span className="text-xs font-black font-mono text-foreground shrink-0">{match.away_score}</span>
        )}
      </div>
    </div>
  )
}

function BracketColumn({
  roundIndex,
  matches,
  label,
}: {
  roundIndex: number
  matches: BracketMatch[]
  label: string
}) {
  const mult = Math.pow(2, roundIndex)
  const paddingTop = ((mult - 1) * CARD_H) / 2
  const gap = (mult - 1) * CARD_H

  return (
    <div className="flex flex-col shrink-0" style={{ width: CARD_W }}>
      <div
        className="flex items-center justify-center"
        style={{ height: HEADER_H }}
      >
        <span className="text-[9px] font-bold text-muted-foreground/40 tracking-widest uppercase">{label}</span>
      </div>
      <div className="flex flex-col" style={{ paddingTop, gap }}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}

// Draws L-shaped connector lines between two adjacent bracket rounds.
// leftRoundIndex: the round index of the LEFT column.
// rightMatchCount: number of matches in the RIGHT column (= left matches / 2).
function ConnectorSVG({
  leftRoundIndex,
  rightMatchCount,
}: {
  leftRoundIndex: number
  rightMatchCount: number
}) {
  const halfW = COL_GAP / 2
  const svgH = HEADER_H + TOTAL_H

  const paths: string[] = []
  for (let i = 0; i < rightMatchCount; i++) {
    const y1 = HEADER_H + getMatchCenterY(leftRoundIndex, 2 * i)
    const y2 = HEADER_H + getMatchCenterY(leftRoundIndex, 2 * i + 1)
    const midY = (y1 + y2) / 2
    // Top branch: exit card → go right to half gap → vertical to midpoint → connect to right card
    paths.push(`M 0 ${y1} H ${halfW} V ${midY} H ${COL_GAP}`)
    // Bottom branch: same but only goes to midpoint (already connected there)
    paths.push(`M 0 ${y2} H ${halfW} V ${midY}`)
  }

  return (
    <svg width={COL_GAP} height={svgH} className="shrink-0">
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.13)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

function DesktopBracket({ matches }: { matches: BracketMatch[] }) {
  const byRound = (r: RoundType) => matches.filter((m) => m.round === r)
  const thirdPlace = matches.filter((m) => m.round === "third_place")

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <div className="flex items-start min-w-max pb-4">
          <BracketColumn roundIndex={0} matches={byRound("round_of_32")} label="Ronda de 32" />
          <ConnectorSVG leftRoundIndex={0} rightMatchCount={8} />
          <BracketColumn roundIndex={1} matches={byRound("round_of_16")} label="Octavos" />
          <ConnectorSVG leftRoundIndex={1} rightMatchCount={4} />
          <BracketColumn roundIndex={2} matches={byRound("quarter_final")} label="Cuartos" />
          <ConnectorSVG leftRoundIndex={2} rightMatchCount={2} />
          <BracketColumn roundIndex={3} matches={byRound("semi_final")} label="Semifinales" />
          <ConnectorSVG leftRoundIndex={3} rightMatchCount={1} />
          <BracketColumn roundIndex={4} matches={byRound("final")} label="Gran Final 🏆" />
        </div>
      </div>

      {thirdPlace.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase mb-2">3er Lugar 🥉</p>
          <div className="flex flex-col gap-2.5 max-w-[172px]">
            {thirdPlace.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MobileView({ matches }: { matches: BracketMatch[] }) {
  const [activeRound, setActiveRound] = useState<RoundType>("round_of_32")
  const byRound = (r: RoundType) => matches.filter((m) => m.round === r)
  const thirdPlace = matches.filter((m) => m.round === "third_place")
  const activeMatches = activeRound === ("third_place" as RoundType) ? thirdPlace : byRound(activeRound)

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
        {ROUNDS.map((r) => (
          <button
            key={r.key}
            onClick={() => setActiveRound(r.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0",
              activeRound === r.key
                ? "bg-foreground text-background"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
            )}
          >
            {r.short}
          </button>
        ))}
        {thirdPlace.length > 0 && (
          <button
            onClick={() => setActiveRound("third_place" as RoundType)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0",
              activeRound === ("third_place" as RoundType)
                ? "bg-foreground text-background"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
            )}
          >
            🥉 3er
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 max-w-xs">
        {activeMatches.map((m) => (
          <MatchCard key={m.id} match={m} stretch />
        ))}
      </div>
    </div>
  )
}

export function BracketView({ matches }: { matches: BracketMatch[] }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">🏆 BRACKET</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cuadro eliminatorio · {matches.length} partidos · Partidos 73–104
        </p>
      </div>

      <div className="hidden lg:block">
        <DesktopBracket matches={matches} />
      </div>

      <div className="lg:hidden">
        <MobileView matches={matches} />
      </div>

      <p className="text-xs text-muted-foreground/40 mt-6 text-center">
        Los equipos en cursiva son posiciones de grupo aún sin definir.
      </p>
    </div>
  )
}
