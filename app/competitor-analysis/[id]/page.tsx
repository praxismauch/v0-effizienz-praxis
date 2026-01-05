import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import CompetitorAnalysisDetailClient from "./page-client"

export const metadata = {
  title: "Konkurrenzanalyse Details | Effizienz Praxis",
  description: "Detaillierte Ansicht der Konkurrenzanalyse",
}

export default async function CompetitorAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CompetitorAnalysisDetailClient analysisId={id} />
    </Suspense>
  )
}
