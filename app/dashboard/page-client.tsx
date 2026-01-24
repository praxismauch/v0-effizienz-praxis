"use client"

import { useEffect, useState, memo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { LazyDashboardOverview } from "@/components/lazy-components"
import { AppLayout } from "@/components/app-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    </AppLayout>
  )
})

const LoadingOverlay = memo(function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  )
})

const NoPracticeFound = memo(function NoPracticeFound({ onRetry }: { onRetry: () => void }) {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle>Keine Praxis gefunden</CardTitle>
            </div>
            <CardDescription>
              Es konnte keine Praxis für Ihr Konto gefunden werden. Bitte wenden Sie sich an den Administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onRetry} variant="outline" className="w-full bg-transparent">
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
})

export default function DashboardPageClient() {
  const { currentUser, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading, practices } = usePractice()
  const router = useRouter()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const hadValidPracticeRef = useRef(false)

  const practiceId = currentPractice?.id?.toString()
  const hasValidPracticeId = !!practiceId

  useEffect(() => {
    if (hasValidPracticeId) {
      hadValidPracticeRef.current = true
    }
  }, [hasValidPracticeId])

  const isContextLoading = userLoading || practiceLoading

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true)
    }, 10000) // 10 second timeout

    return () => clearTimeout(timer)
  }, [retryCount])

  useEffect(() => {
    if (loadingTimeout && !currentUser) {
      router.push("/auth/login")
    }
  }, [loadingTimeout, currentUser, router])

  const handleRetry = () => {
    setLoadingTimeout(false)
    hadValidPracticeRef.current = false
    setRetryCount((prev) => prev + 1)
    window.location.reload()
  }

  // Show loading state while contexts are loading
  if (isContextLoading && !loadingTimeout) {
    return <DashboardSkeleton />
  }

  // Redirect if no user after timeout
  if (!currentUser) {
    return <LoadingOverlay message="Weiterleitung zur Anmeldung..." />
  }

  if (!hasValidPracticeId && hadValidPracticeRef.current && !loadingTimeout) {
    return <DashboardSkeleton />
  }

  // Show error only if loading is complete and we never had a valid practiceId
  if (!hasValidPracticeId && !isContextLoading) {
    toast.error("Keine Praxis-ID gefunden. Bitte melden Sie sich neu an oder kontaktieren Sie den Support.")
    return <NoPracticeFound onRetry={handleRetry} />
  }

  // Still waiting for practiceId
  if (!hasValidPracticeId) {
    return <DashboardSkeleton />
  }

  return (
    <OnboardingWrapper>
      <AppLayout>
        <LazyDashboardOverview practiceId={practiceId!} userId={currentUser?.id || "fallback-user-id"} />
      </AppLayout>
    </OnboardingWrapper>
  )
}
