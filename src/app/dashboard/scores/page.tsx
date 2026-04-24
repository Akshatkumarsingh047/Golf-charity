import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScoreManager } from '@/features/scores/ScoreManager'
import { DashboardNav } from '@/components/ui/Nav'

export const metadata = { title: 'My Scores' }

export default async function ScoresPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: scores } = await supabase
    .from('scores')
    .select('id, score_value, score_date, created_at')
    .eq('user_id', session.user.id)
    .order('score_date', { ascending: false })
    .limit(5)

  return (
    <>
      <DashboardNav user={session.user} />
      <main className="pt-20 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-brand-text mb-2">My Scores</h1>
            <p className="text-brand-subtext">Your last 5 Stableford scores. These are used as your draw numbers each month.</p>
          </div>
          <ScoreManager initialScores={scores ?? []} userId={session.user.id} />
        </div>
      </main>
    </>
  )
}
