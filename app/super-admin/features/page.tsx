import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import FeaturesClient from "./page-client"

export const dynamic = "force-dynamic"

export default function FeaturesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <FeaturesClient />
    </Suspense>
  )
}
