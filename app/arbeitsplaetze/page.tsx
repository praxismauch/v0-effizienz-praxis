"use client"

import { Suspense } from "react"
import ArbeitsplaetzeManagement from "@/components/arbeitsplaetze/arbeitsplaetze-management"
import { AppLayout } from "@/components/app-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function ArbeitsplaetzePage() {
  return (
    <AppLayout noPadding>
      <Suspense fallback={<ArbeitsplaetzeLoadingSkeleton />}>
        <ArbeitsplaetzeManagement />
      </Suspense>
    </AppLayout>
  )
}

function ArbeitsplaetzeLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}
