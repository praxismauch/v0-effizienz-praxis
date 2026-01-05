"use client"

import type { ReactNode } from "react"
import { usePracticeId } from "@/lib/hooks/use-practice-id"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Building2, Loader2 } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"

interface PracticeGuardProps {
  children: ReactNode
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode
  /**
   * Custom error component - receives error message
   */
  errorComponent?: (error: string) => ReactNode
  /**
   * Whether to show practice selector for super admins without a practice
   */
  showPracticeSelector?: boolean
  /**
   * Fallback practice ID to use if none is available (use with caution)
   */
  fallbackPracticeId?: string
}

/**
 * Guard component that ensures a valid practice ID is available before rendering children.
 * Handles loading states, errors, and super admin practice selection.
 *
 * Usage:
 * ```tsx
 * <PracticeGuard>
 *   <MyComponent /> // Will only render when practiceId is available
 * </PracticeGuard>
 * ```
 */
export function PracticeGuard({
  children,
  loadingComponent,
  errorComponent,
  showPracticeSelector = true,
  fallbackPracticeId,
}: PracticeGuardProps) {
  const { practiceId, isReady, isLoading, error, isSuperAdmin } = usePracticeId()
  const { practices, setCurrentPractice } = usePractice()

  // Use fallback if provided and no practice ID
  const effectivePracticeId = practiceId || fallbackPracticeId
  const effectiveIsReady = isReady || (!!fallbackPracticeId && !isLoading)

  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Lade Praxisdaten...</p>
        </div>
      </div>
    )
  }

  // Error state - no practice ID available
  if (!effectiveIsReady || !effectivePracticeId) {
    // Custom error component
    if (errorComponent && error) {
      return <>{errorComponent(error)}</>
    }

    // Super admin without practice selected - show selector
    if (isSuperAdmin && showPracticeSelector && practices.length > 0) {
      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Praxis auswählen
            </CardTitle>
            <CardDescription>Als Super Admin müssen Sie eine Praxis auswählen, um fortzufahren.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {practices.slice(0, 10).map((practice) => (
                <Button
                  key={practice.id}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setCurrentPractice(practice)}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {practice.name}
                  {!practice.isActive && <span className="ml-auto text-xs text-muted-foreground">(Inaktiv)</span>}
                </Button>
              ))}
              {practices.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">Und {practices.length - 10} weitere...</p>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    // Default error display
    return (
      <Card className="max-w-md mx-auto mt-8 border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Keine Praxis verfügbar
          </CardTitle>
          <CardDescription>{error || "Es konnte keine Praxis geladen werden."}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin
              ? "Bitte wählen Sie eine Praxis aus dem Dropdown-Menü in der Kopfzeile aus."
              : "Bitte kontaktieren Sie Ihren Administrator, um Zugang zu einer Praxis zu erhalten."}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Practice ID is available - render children
  return <>{children}</>
}

export default PracticeGuard
