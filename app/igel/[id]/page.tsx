import { Suspense } from "react"
import { AppLayout } from "@/components/app-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { IgelAnalysisView } from "@/components/igel/igel-analysis-view"

export const metadata = {
  title: "Analyse Details | Effizienz Praxis",
  description: "Detaillierte Analyse der Selbstzahlerleistung",
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

export default function IgelAnalysisPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <Suspense fallback={<LoadingSkeleton />}>
        <IgelAnalysisView analysisId={params.id} />
      </Suspense>
    </AppLayout>
  )
}
