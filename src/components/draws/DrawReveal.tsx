'use client'
import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'

interface DrawRevealProps {
  winningNumbers: number[]
  userNumbers?: number[]
  matchCount?: number
  onComplete?: () => void
}

export function DrawReveal({ winningNumbers, userNumbers = [], matchCount, onComplete }: DrawRevealProps) {
  const [revealed, setRevealed] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const hasWon = matchCount && matchCount >= 3

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < winningNumbers.length) {
        setRevealed(prev => [...prev, winningNumbers[i]])
        i++
      } else {
        clearInterval(interval)
        setDone(true)
        if (hasWon) {
          // Fire confetti!
          const fire = (particleRatio: number, opts: confetti.Options) => {
            confetti({ origin: { y: 0.7 }, ...opts, particleCount: Math.floor(200 * particleRatio) })
          }
          fire(0.25, { spread: 26, startVelocity: 55 })
          fire(0.2, { spread: 60 })
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
          fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
          fire(0.1, { spread: 120, startVelocity: 45 })
        }
        onComplete?.()
      }
    }, 600)
    return () => clearInterval(interval)
  }, [winningNumbers, hasWon, onComplete])

  const userSet = new Set(userNumbers)

  return (
    <div className="text-center space-y-8">
      <h2 className="font-display text-2xl font-bold text-brand-text">
        {done ? (hasWon ? '🎉 You matched numbers!' : 'Draw complete') : 'Drawing numbers...'}
      </h2>

      {/* Winning numbers */}
      <div className="flex justify-center gap-4 flex-wrap">
        {winningNumbers.map((n, i) => {
          const isRevealed = revealed.includes(n)
          const isMatch = userSet.has(n)
          return (
            <div
              key={i}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl transition-all duration-300 ${
                isRevealed
                  ? isMatch
                    ? 'bg-brand-accent text-brand-bg scale-110 shadow-lg shadow-brand-accent/30'
                    : 'bg-brand-card border-2 border-brand-border text-brand-text'
                  : 'bg-brand-surface border-2 border-dashed border-brand-border text-transparent'
              }`}
              style={isRevealed ? { animation: 'numberReveal 0.5s ease-out' } : {}}
            >
              {isRevealed ? n : '?'}
            </div>
          )
        })}
      </div>

      {/* User's numbers */}
      {userNumbers.length > 0 && done && (
        <div>
          <p className="text-brand-muted text-sm mb-3">Your numbers</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {userNumbers.map((n, i) => {
              const isMatch = winningNumbers.includes(n)
              return (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border-2 ${
                    isMatch
                      ? 'border-brand-accent text-brand-accent bg-brand-accent/10'
                      : 'border-brand-border text-brand-muted bg-brand-surface'
                  }`}
                >
                  {n}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Result */}
      {done && (
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg ${
          hasWon
            ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30'
            : 'bg-brand-card text-brand-subtext border border-brand-border'
        }`}>
          {hasWon ? `🏆 ${matchCount} matches — You won!` : 'No match this month — keep playing!'}
        </div>
      )}
    </div>
  )
}
