import { Suspense } from "react"
import { IgelAnalysisFullView } from "./igel-analysis-full-view"

export default function IgelAnalysisResultPage({ params }: { params: { analysisId: string } }) {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <IgelAnalysisFullView analysisId={params.analysisId} />
    </Suspense>
  )
}
