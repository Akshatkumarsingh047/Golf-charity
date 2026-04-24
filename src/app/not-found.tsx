import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-6">
        <Trophy className="w-8 h-8 text-brand-accent" />
      </div>
      <h1 className="font-display text-6xl font-bold text-brand-text mb-2">404</h1>
      <h2 className="font-display text-2xl font-semibold text-brand-subtext mb-4">Page not found</h2>
      <p className="text-brand-muted mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg">Back to Home</Button>
      </Link>
    </div>
  )
}
