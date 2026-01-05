import { Skeleton } from "@/components/ui/skeleton"

export default function RoomsLoading() {
  return (
    <div className="container mx-auto py-6 px-4">
      <Skeleton className="h-10 w-48 mb-6" />
      <Skeleton className="w-full h-96" />
    </div>
  )
}
