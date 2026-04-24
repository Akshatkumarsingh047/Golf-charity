// ─── Database row types ───────────────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'lapsed'
export type DrawType = 'random' | 'algorithmic'
export type DrawStatus = 'pending' | 'simulated' | 'published'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type PayoutStatus = 'pending' | 'paid'
export type ContributionType = 'subscription' | 'independent'

export interface User {
  id: string
  email: string
  full_name: string | null
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  subscription_plan: 'monthly' | 'yearly' | null
  subscription_end: string | null
  charity_id: string | null
  charity_percentage: number
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  description: string | null
  image_url: string | null
  website_url: string | null
  is_featured: boolean
  upcoming_events: CharityEvent[] | null
  is_active: boolean
  created_at: string
}

export interface CharityEvent {
  title: string
  date: string
  description: string
}

export interface Score {
  id: string
  user_id: string
  score_value: number
  score_date: string
  created_at: string
}

export interface Draw {
  id: string
  draw_month: string
  draw_type: DrawType
  status: DrawStatus
  winning_numbers: number[]
  jackpot_amount: number
  pool_4match: number
  pool_3match: number
  jackpot_rolled: boolean
  published_at: string | null
  created_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  user_scores: number[]
  match_count: number | null
  prize_amount: number | null
  created_at: string
}

export interface WinnerVerification {
  id: string
  draw_entry_id: string
  user_id: string
  proof_url: string
  status: VerificationStatus
  admin_notes: string | null
  payout_status: PayoutStatus
  reviewed_at: string | null
  paid_at: string | null
  created_at: string
}

export interface CharityContribution {
  id: string
  user_id: string
  charity_id: string
  amount: number
  contribution_type: ContributionType
  stripe_payment_id: string | null
  created_at: string
}

export interface PrizePoolConfig {
  id: 1
  monthly_price_cents: number
  yearly_price_cents: number
  pool_percentage: number
  charity_min_pct: number
  jackpot_share_pct: number
  four_match_share_pct: number
  three_match_share_pct: number
}

// ─── Derived / view types ─────────────────────────────────────────────────────

export interface DrawEntryWithUser extends DrawEntry {
  users: { email: string; full_name: string | null }
}

export interface WinnerWithDetails extends WinnerVerification {
  draw_entries: DrawEntry & {
    draws: Pick<Draw, 'draw_month' | 'winning_numbers'>
  }
  users: Pick<User, 'email' | 'full_name'>
}

export interface SimulationResult {
  winning_numbers: number[]
  entries: Array<{
    user_id: string
    email: string
    full_name: string | null
    user_scores: number[]
    match_count: number
    prize_amount: number
  }>
  jackpot_amount: number
  pool_4match: number
  pool_3match: number
  jackpot_rolled: boolean
  five_match_count: number
  four_match_count: number
  three_match_count: number
}
