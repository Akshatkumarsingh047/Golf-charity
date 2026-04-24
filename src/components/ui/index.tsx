import React from 'react'

// ─── Button ────────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size    = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'

const variantStyles: Record<Variant, string> = {
  primary:   'bg-brand-accent text-brand-bg hover:brightness-110 shadow-accent hover:shadow-accent-lg active:scale-[0.97]',
  secondary: 'bg-brand-card border border-brand-border text-brand-text hover:bg-brand-card/80 hover:border-brand-border-hi active:scale-[0.97]',
  ghost:     'text-brand-subtext hover:text-brand-text hover:bg-brand-card active:scale-[0.97]',
  danger:    'bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 hover:border-red-500/40 active:scale-[0.97]',
  outline:   'border border-brand-accent text-brand-accent hover:bg-brand-accent/10 active:scale-[0.97]',
}
const sizeStyles: Record<Size, string> = {
  xs:   'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  sm:   'px-4 py-2 text-sm rounded-xl gap-2',
  md:   'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg:   'px-7 py-3.5 text-base rounded-2xl gap-2',
  xl:   'px-9 py-4.5 text-lg rounded-2xl gap-2.5',
  icon: 'p-2 rounded-xl',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'active' | 'inactive' | 'lapsed' | 'cancelled' | 'pending' | 'approved' | 'rejected' | 'paid' | 'default'

const badgeStyles: Record<BadgeVariant, string> = {
  active:    'bg-brand-accent/15 text-brand-accent border-brand-accent/25',
  inactive:  'bg-brand-muted/20 text-brand-subtext border-brand-muted/30',
  lapsed:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
  pending:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
  approved:  'bg-brand-accent/15 text-brand-accent border-brand-accent/25',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/25',
  paid:      'bg-purple-500/15 text-purple-400 border-purple-500/25',
  default:   'bg-brand-card text-brand-subtext border-brand-border',
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide ${badgeStyles[variant]}`}>
      {label}
    </span>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', gradient }: { children: React.ReactNode; className?: string; gradient?: boolean }) {
  return (
    <div className={`${gradient ? 'gradient-border' : 'bg-brand-card border border-brand-border rounded-2xl'} p-6 ${className}`}>
      {children}
    </div>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="font-display text-3xl md:text-5xl font-bold text-brand-text mb-4 tracking-tight">{title}</h2>
      {subtitle && <p className="text-brand-subtext text-lg max-w-xl mx-auto leading-relaxed">{subtitle}</p>}
    </div>
  )
}

// ─── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-brand-subtext mb-1.5 uppercase tracking-wider">{label}</label>}
      <input
        className={`w-full bg-brand-surface border ${error ? 'border-brand-danger' : 'border-brand-border'} rounded-xl px-4 py-3 text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all duration-200 text-sm ${className}`}
        {...props}
      />
      {hint  && !error && <p className="mt-1.5 text-xs text-brand-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-brand-danger flex items-center gap-1">⚠ {error}</p>}
    </div>
  )
}

// ─── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-brand-subtext mb-1.5 uppercase tracking-wider">{label}</label>}
      <select
        className={`w-full bg-brand-surface border ${error ? 'border-brand-danger' : 'border-brand-border'} rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-accent transition-all text-sm ${className}`}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-1.5 text-xs text-brand-danger">⚠ {error}</p>}
    </div>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="stat-card bg-brand-card border border-brand-border rounded-2xl p-6 relative overflow-hidden group">
      {/* Subtle gradient on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${accent ? 'bg-gradient-to-br from-brand-accent/5 to-transparent' : 'bg-gradient-to-br from-brand-border/50 to-transparent'}`} />
      <div className="relative">
        <p className="text-brand-subtext text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
        <p className={`text-3xl font-display font-bold tracking-tight ${accent ? 'text-brand-accent' : 'text-brand-text'}`}>{value}</p>
        {sub && <p className="text-brand-muted text-xs mt-1.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-muted mb-5">
        {icon}
      </div>
      <h3 className="text-brand-text font-display font-semibold text-xl mb-2">{title}</h3>
      {description && <p className="text-brand-subtext text-sm max-w-xs mb-6 leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}

// ─── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-brand-border" />
      {label && <span className="text-brand-muted text-xs font-medium">{label}</span>}
      <div className="flex-1 h-px bg-brand-border" />
    </div>
  )
}