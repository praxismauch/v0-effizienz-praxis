"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

const RoadmapManager = dynamic(() => import("@/components/roadmap-manager"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt Roadmap...</div>,
})

export default function SuperAdminRoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Lade Roadmap...</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roadmap & KI-Ideen</h1>
          <p className="text-muted-foreground mt-2">Planen und verfolgen Sie die Entwicklung neuer Features</p>
        </div>
        <RoadmapManager userId="super-admin" />
      </div>
    </Suspense>
  )
}
