import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

// ─── Button ───────────────────────────────────────────────────────────────────
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:   'bg-brand-accent text-brand-bg hover:brightness-110 glow-accent',
        secondary: 'bg-brand-card border border-brand-border text-brand-text hover:border-brand-accent/50',
        ghost:     'text-brand-subtext hover:text-brand-text hover:bg-brand-card',
        danger:    'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30',
        outline:   'border border-brand-accent text-brand-accent hover:bg-brand-accent/10',
      },
      size: {
        sm:  'px-4 py-2 text-sm',
        md:  'px-6 py-3 text-sm',
        lg:  'px-8 py-4 text-base',
        xl:  'px-10 py-5 text-lg',
        icon:'p-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({ className = '', variant, size, loading, children, ...props }: ButtonProps) {
  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps { label: string; variant?: 'active' | 'inactive' | 'lapsed' | 'cancelled' | 'pending' | 'approved' | 'rejected' | 'paid' | 'default' }

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const styles: Record<string, string> = {
    active:    'bg-brand-accent/20 text-brand-accent border-brand-accent/30',
    inactive:  'bg-gray-500/20 text-gray-400 border-gray-500/30',
    lapsed:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
    approved:  'bg-brand-accent/20 text-brand-accent border-brand-accent/30',
    rejected:  'bg-red-500/20 text-red-400 border-red-500/30',
    paid:      'bg-purple-500/20 text-purple-400 border-purple-500/30',
    default:   'bg-brand-card text-brand-subtext border-brand-border',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {label}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  gradient?: boolean
}

export function Card({ children, className = '', gradient }: CardProps) {
  return (
    <div className={`${gradient ? 'gradient-border' : 'bg-brand-card border border-brand-border rounded-2xl'} p-6 ${className}`}>
      {children}
    </div>
  )
}

// ─── Section heading ─────────────────────────────────────────────────────────
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="font-display text-3xl md:text-5xl font-bold text-brand-text mb-4">{title}</h2>
      {subtitle && <p className="text-brand-subtext text-lg max-w-xl mx-auto">{subtitle}</p>}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-brand-subtext mb-1.5">{label}</label>}
      <input
        className={`w-full bg-brand-surface border ${error ? 'border-red-500' : 'border-brand-border'} rounded-xl px-4 py-3 text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors ${className}`}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-brand-subtext mb-1.5">{label}</label>}
      <select
        className={`w-full bg-brand-surface border ${error ? 'border-red-500' : 'border-brand-border'} rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-accent transition-colors ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
      <p className="text-brand-subtext text-sm mb-1">{label}</p>
      <p className={`text-3xl font-display font-bold ${accent ? 'text-brand-accent' : 'text-brand-text'}`}>{value}</p>
      {sub && <p className="text-brand-muted text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-brand-muted mb-4">{icon}</div>
      <h3 className="text-brand-text font-semibold text-lg mb-2">{title}</h3>
      {description && <p className="text-brand-subtext text-sm max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  )
}
