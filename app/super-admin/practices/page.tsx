import { Suspense } from "react"
import PracticesPageClient from "./page-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Praxenverwaltung | Super Admin",
  description: "Verwalten Sie alle Praxen im System",
}

export default function PracticesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <PracticesPageClient />
    </Suspense>
  )
}
