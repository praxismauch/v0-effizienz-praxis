import { Suspense } from "react"
import { IgelManagement } from "@/components/igel/igel-management"
import { AppLayout } from "@/components/app-layout"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Selbstzahlerleistungen | Effizienz Praxis",
  description: "Analysieren Sie die Rentabilität Ihrer Selbstzahlerleistungen",
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function IgelPage() {
  return (
    <AppLayout>
      <Suspense fallback={<LoadingSkeleton />}>
        <IgelManagement />
      </Suspense>
    </AppLayout>
  )
}
