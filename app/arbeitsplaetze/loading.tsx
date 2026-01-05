export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}
