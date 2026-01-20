"use client"

import { Suspense } from "react"
import { IgelManagement } from "@/components/igel/igel-management"
import { AppLayout } from "@/components/app-layout"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function IgelAnalysisClientPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Selbstzahler-Analyse</h1>
          <p className="text-muted-foreground">
            Analysieren Sie Ihre Selbstzahlerleistungen auf Rentabilität und Optimierungspotenzial
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <IgelManagement />
        </Suspense>
      </div>
    </AppLayout>
  )
}
