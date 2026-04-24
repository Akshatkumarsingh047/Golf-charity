export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-bg pt-20">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {/* Skeleton header */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-brand-card rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-brand-card rounded-xl animate-pulse" />
        </div>
        {/* Skeleton cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-brand-card border border-brand-border rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-brand-card border border-brand-border rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
