import { Suspense } from "react"
import { IgelAnalysisFullView } from "./igel-analysis-full-view"

export default function IgelAnalysisResultPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <IgelAnalysisFullView analysisId={params.id} />
    </Suspense>
  )
}
