export type Group = {
  id: number
  name: string
}

export type Team = {
  id: number
  name: string
  flag_emoji: string
  group_id: number
  confederation?: string | null
  groups?: Group
}

export type RoundType =
  | "group" | "round_of_32" | "round_of_16"
  | "quarter_final" | "semi_final" | "third_place" | "final"

export type Match = {
  id: number
  match_number: number
  home_team_id: number | null
  away_team_id: number | null
  group_id: number | null
  round: RoundType
  home_slot: string | null
  away_slot: string | null
  scheduled_at: string
  home_score: number | null
  away_score: number | null
  status: "scheduled" | "finished"
  home_team?: Team | null
  away_team?: Team | null
  groups?: Group
}

export type Prediction = {
  id: string
  user_id: string
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  points: number | null
  created_at: string
}

export type BonusPrediction = {
  id: string
  user_id: string
  champion_team_id: number | null
  third_place_team_id: number | null
  champion_points: number
  third_place_points: number
  created_at: string
}

export type LeaderboardEntry = {
  user_id: string
  display_name: string
  total_points: number
  exact_scores: number
  winner_results: number
  draw_results: number
  total_correct: number
  total_predictions: number
}

export type Profile = {
  id: string
  display_name: string
  created_at: string
}

export type MatchWithPrediction = Match & {
  prediction?: Prediction
}

export type GroupWithMatches = Group & {
  teams: Team[]
  matches: MatchWithPrediction[]
}
