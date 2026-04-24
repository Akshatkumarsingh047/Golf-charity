'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui'
import { AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h1 className="font-display text-3xl font-bold text-brand-text mb-2">Something went wrong</h1>
      <p className="text-brand-muted mb-8 max-w-sm">
        An unexpected error occurred. Please try again or contact support if the issue persists.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="secondary" onClick={() => window.location.href = '/'}>Go Home</Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-8 text-left text-xs text-red-400 bg-brand-card border border-brand-border rounded-xl p-4 max-w-2xl overflow-auto">
          {error.message}
          {error.stack}
        </pre>
      )}
    </div>
  )
}
