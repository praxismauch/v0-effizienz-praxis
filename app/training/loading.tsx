import { Skeleton } from "@/components/ui/skeleton"

export default function TrainingLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-64 border-r bg-card">
        <Skeleton className="h-full" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b">
          <Skeleton className="h-full" />
        </div>
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    </div>
  )
}
