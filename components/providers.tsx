"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { UserProvider, type User } from "@/contexts/user-context"
import { PracticeProvider } from "@/contexts/practice-context"
import { TeamProvider } from "@/contexts/team-context"
import { TodoProvider } from "@/contexts/todo-context"
import { CalendarProvider } from "@/contexts/calendar-context"
import { WorkflowProvider } from "@/contexts/workflow-context"
import { AnalyticsDataProvider } from "@/contexts/analytics-data-context"
import { TranslationProvider } from "@/contexts/translation-context"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import { SidebarSettingsProvider } from "@/contexts/sidebar-settings-context"
import RoutePersistence from "@/components/route-persistence"
import GlobalDragPrevention from "@/components/global-drag-prevention"
import { SWRProvider } from "@/lib/swr-config"
import { ErrorBoundary } from "@/components/error-boundary"
import { isPublicRoute } from "@/lib/constants/routes"

/**
 * Heavy dashboard-only providers.
 * Only rendered on authenticated (non-public) routes.
 * This avoids loading ~1,800 lines of context code on public pages.
 */
function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <PracticeProvider>
      <SidebarSettingsProvider>
        <OnboardingProvider>
          <TeamProvider>
            <TodoProvider>
              <CalendarProvider>
                <WorkflowProvider>
                  <AnalyticsDataProvider>
                    <RoutePersistence />
                    <GlobalDragPrevention />
                    {children}
                  </AnalyticsDataProvider>
                </WorkflowProvider>
              </CalendarProvider>
            </TodoProvider>
          </TeamProvider>
        </OnboardingProvider>
      </SidebarSettingsProvider>
    </PracticeProvider>
  )
}

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser?: User | null
}) {
  const pathname = usePathname()
  const needsDashboardProviders = !isPublicRoute(pathname)

  return (
    <SWRProvider>
      <UserProvider initialUser={initialUser}>
        <TranslationProvider>
          <ErrorBoundary>
            {needsDashboardProviders ? (
              <DashboardProviders>{children}</DashboardProviders>
            ) : (
              children
            )}
          </ErrorBoundary>
        </TranslationProvider>
      </UserProvider>
    </SWRProvider>
  )
}

export default Providers
