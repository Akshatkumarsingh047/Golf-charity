import { type ClassValue, clsx } from 'clsx'

// ─── Class name merger ────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

// ─── Format currency ──────────────────────────────────────────────────────────
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount)
}

// ─── Format date ──────────────────────────────────────────────────────────────
export function formatDate(date: string | Date, fmt: 'short' | 'long' | 'month' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const options: Intl.DateTimeFormatOptions =
    fmt === 'month' ? { month: 'long', year: 'numeric' }
    : fmt === 'long' ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  return d.toLocaleDateString('en-IE', options)
}

// ─── Get first day of month ────────────────────────────────────────────────────
export function firstOfMonth(date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}

// ─── Validate Stableford score ────────────────────────────────────────────────
export function isValidScore(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 45
}

// ─── Sleep ────────────────────────────────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Count set intersection ───────────────────────────────────────────────────
export function intersectionCount(a: number[], b: number[]): number {
  const setB = new Set(b)
  return a.filter(x => setB.has(x)).length
}

// ─── Truncate text ────────────────────────────────────────────────────────────
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

// ─── Generate unique filename ─────────────────────────────────────────────────
export function uniqueFilename(original: string): string {
  const ext = original.split('.').pop()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
}
