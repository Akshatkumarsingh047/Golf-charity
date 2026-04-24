'use client'
import { useEffect, useRef, useState } from 'react'

interface PrizeCounterProps {
  target: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function PrizeCounter({ target, prefix = '€', suffix = '', duration = 2000, className = '' }: PrizeCounterProps) {
  const [current, setCurrent] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) return

    function animate(timestamp: number) {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(eased * target)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  return (
    <span className={`prize-counter ${className}`}>
      {prefix}{current.toFixed(2)}{suffix}
    </span>
  )
}
