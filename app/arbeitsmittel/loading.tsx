export default function Loading() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded" />
    </div>
  )
}
