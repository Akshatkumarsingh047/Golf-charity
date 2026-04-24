import { createServiceClient } from '@/lib/supabase/server'
import type { SimulationResult, DrawType } from '@/types'

// ─── Number generation ────────────────────────────────────────────────────────

/** Generate 5 unique random integers from 1–45 */
function generateRandomNumbers(): number[] {
  const nums = new Set<number>()
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(nums)
}

/**
 * Algorithmic weighted draw:
 * - Count frequency of each score value across all active users' scores
 * - Score values with higher frequency get proportionally more weight
 * - Weighted sampling without replacement for 5 unique numbers
 */
function generateAlgorithmicNumbers(allScores: number[]): number[] {
  // Count frequency of each value 1–45
  const freq: Record<number, number> = {}
  for (let i = 1; i <= 45; i++) freq[i] = 0
  for (const s of allScores) freq[s] = (freq[s] ?? 0) + 1

  // Build weighted pool (each number appears freq[n] + 1 times to ensure all are eligible)
  const pool: number[] = []
  for (let i = 1; i <= 45; i++) {
    const weight = freq[i] + 1 // +1 so even unseen scores have a chance
    for (let j = 0; j < weight; j++) pool.push(i)
  }

  // Weighted sampling without replacement
  const selected = new Set<number>()
  const remaining = [...pool]

  while (selected.size < 5 && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length)
    selected.add(remaining[idx])
    // Remove all occurrences of the selected number
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i] === remaining[idx]) remaining.splice(i, 1)
    }
  }

  // Fallback: if somehow we don't have 5 (shouldn't happen), fill randomly
  while (selected.size < 5) {
    for (let n = 1; n <= 45 && selected.size < 5; n++) selected.add(n)
  }

  return Array.from(selected)
}

// ─── Match counting ───────────────────────────────────────────────────────────

/** Count how many values appear in both arrays (set intersection) */
function countMatches(userScores: number[], winningNumbers: number[]): number {
  const winSet = new Set(winningNumbers)
  return userScores.filter(s => winSet.has(s)).length
}

// ─── Prize pool calculation ───────────────────────────────────────────────────

interface PrizePool {
  jackpot: number
  pool4: number
  pool3: number
  totalPool: number
}

async function calculatePrizePool(activeUserIds: string[], rolledJackpot: number): Promise<PrizePool> {
  const supabase = createServiceClient()

  // Get prize pool config
  const { data: config } = await supabase
    .from('prize_pool_config')
    .select('*')
    .eq('id', 1)
    .single()

  const poolPct = config?.pool_percentage ?? 70
  const monthlyPriceCents = config?.monthly_price_cents ?? 999
  const yearlyPriceCents = config?.yearly_price_cents ?? 9999

  // Fetch subscription plans for active users
  const { data: users } = await supabase
    .from('users')
    .select('subscription_plan')
    .in('id', activeUserIds)

  let totalRevenueCents = 0
  for (const u of users ?? []) {
    totalRevenueCents += u.subscription_plan === 'yearly'
      ? Math.round(yearlyPriceCents / 12) // monthly equivalent
      : monthlyPriceCents
  }

  const totalPool = (totalRevenueCents * poolPct) / 100 / 100 // convert cents → euros

  const jackpotShare = config?.jackpot_share_pct ?? 40
  const fourMatchShare = config?.four_match_share_pct ?? 35
  const threeMatchShare = config?.three_match_share_pct ?? 25

  return {
    totalPool,
    jackpot: totalPool * (jackpotShare / 100) + rolledJackpot,
    pool4: totalPool * (fourMatchShare / 100),
    pool3: totalPool * (threeMatchShare / 100),
  }
}

// ─── Core draw simulation ─────────────────────────────────────────────────────

export async function simulateDraw(drawType: DrawType): Promise<SimulationResult> {
  const supabase = createServiceClient()

  // Fetch all active subscribers — exclude admin accounts
  // Admins are platform operators, not players, and must never appear in draws
  const { data: activeUsers } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('subscription_status', 'active')
    .neq('role', 'admin')

  if (!activeUsers?.length) {
    throw new Error('No active subscribers found')
  }

  const activeUserIds = activeUsers.map(u => u.id)

  // Fetch scores for all active users
  const { data: allScoreRows } = await supabase
    .from('scores')
    .select('user_id, score_value, score_date')
    .in('user_id', activeUserIds)
    .order('score_date', { ascending: false })

  // Build per-user score snapshots (last 5 per user)
  const userScoreMap: Record<string, number[]> = {}
  for (const row of allScoreRows ?? []) {
    if (!userScoreMap[row.user_id]) userScoreMap[row.user_id] = []
    if (userScoreMap[row.user_id].length < 5) {
      userScoreMap[row.user_id].push(row.score_value)
    }
  }

  // All score values for algorithmic weighting
  const allScoreValues = (allScoreRows ?? []).map(r => r.score_value)

  // Generate winning numbers
  const winningNumbers = drawType === 'algorithmic'
    ? generateAlgorithmicNumbers(allScoreValues)
    : generateRandomNumbers()

  // Check for rolled jackpot from previous draw
  const { data: lastDraw } = await supabase
    .from('draws')
    .select('jackpot_amount, jackpot_rolled')
    .eq('status', 'published')
    .order('draw_month', { ascending: false })
    .limit(1)
    .single()

  const rolledJackpot = lastDraw?.jackpot_rolled ? (lastDraw.jackpot_amount ?? 0) : 0

  // Calculate prize pool
  const prizes = await calculatePrizePool(activeUserIds, rolledJackpot)

  // Calculate match counts for each user
  const entries = activeUsers.map(user => {
    const userScores = userScoreMap[user.id] ?? []
    const matchCount = countMatches(userScores, winningNumbers)
    return { user_id: user.id, email: user.email, full_name: user.full_name, user_scores: userScores, match_count: matchCount, prize_amount: 0 }
  })

  // Count winners per tier
  const fiveMatch = entries.filter(e => e.match_count === 5)
  const fourMatch = entries.filter(e => e.match_count === 4)
  const threeMatch = entries.filter(e => e.match_count === 3)

  // Distribute prizes
  const jackpotRolled = fiveMatch.length === 0

  for (const e of entries) {
    if (e.match_count === 5 && fiveMatch.length > 0) {
      e.prize_amount = prizes.jackpot / fiveMatch.length
    } else if (e.match_count === 4 && fourMatch.length > 0) {
      e.prize_amount = prizes.pool4 / fourMatch.length
    } else if (e.match_count === 3 && threeMatch.length > 0) {
      e.prize_amount = prizes.pool3 / threeMatch.length
    }
  }

  return {
    winning_numbers: winningNumbers,
    entries,
    jackpot_amount: prizes.jackpot,
    pool_4match: prizes.pool4,
    pool_3match: prizes.pool3,
    jackpot_rolled: jackpotRolled,
    five_match_count: fiveMatch.length,
    four_match_count: fourMatch.length,
    three_match_count: threeMatch.length,
  }
}

// ─── Publish draw ─────────────────────────────────────────────────────────────

export async function publishDraw(drawType: DrawType, drawMonth: string): Promise<{ drawId: string }> {
  const supabase = createServiceClient()

  // Verify no draw exists for this month
  const { data: existingDraw } = await supabase
    .from('draws')
    .select('id')
    .eq('draw_month', drawMonth)
    .single()

  if (existingDraw) {
    throw new Error(`A draw already exists for ${drawMonth}`)
  }

  // Run the simulation
  const sim = await simulateDraw(drawType)

  // Create draw record
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .insert({
      draw_month: drawMonth,
      draw_type: drawType,
      status: 'published',
      winning_numbers: sim.winning_numbers,
      jackpot_amount: sim.jackpot_amount,
      pool_4match: sim.pool_4match,
      pool_3match: sim.pool_3match,
      jackpot_rolled: sim.jackpot_rolled,
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (drawError || !draw) throw new Error('Failed to create draw record')

  // Insert draw entries for all participants
  const entryRows = sim.entries.map(e => ({
    draw_id: draw.id,
    user_id: e.user_id,
    user_scores: e.user_scores,
    match_count: e.match_count >= 3 ? e.match_count : null,
    prize_amount: e.prize_amount > 0 ? e.prize_amount : null,
  }))

  if (entryRows.length > 0) {
    const { error: entryError } = await supabase
      .from('draw_entries')
      .insert(entryRows)
    if (entryError) throw new Error('Failed to insert draw entries')
  }

  // Send emails to all participants
  const { sendEmail, emailTemplates } = await import('@/lib/email')
  for (const entry of sim.entries) {
    await sendEmail({
      to: entry.email,
      subject: `GolfDraw — ${new Date(drawMonth).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })} draw results`,
      html: emailTemplates.drawResults(
        entry.full_name ?? entry.email,
        sim.winning_numbers,
        entry.match_count >= 3 ? entry.match_count : null,
      ),
    })

    // Extra winner email
    if (entry.match_count >= 3) {
      await sendEmail({
        to: entry.email,
        subject: '🏆 You won the GolfDraw!',
        html: emailTemplates.winnerNotification(
          entry.full_name ?? entry.email,
          entry.match_count,
          entry.prize_amount,
        ),
      })
    }
  }

  return { drawId: draw.id }
}