import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <Skeleton className="h-10 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
