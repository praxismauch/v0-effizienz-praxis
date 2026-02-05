"use client"

import React, { type ReactNode } from "react"
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
import { SWRConfig } from "swr"
import { ErrorBoundary } from "@/components/error-boundary"

const PUBLIC_ROUTES = [
  "/",
  // Auth routes
  "/login",
  "/register",
  "/auth/login",
  "/auth/register",
  "/auth/sign-up",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/pending-approval",
  "/auth/sign-up-success",
  // Landing pages
  "/features",
  "/effizienz",
  "/about",
  "/contact",
  "/kontakt",
  "/preise",
  "/coming-soon",
  "/demo",
  "/help",
  "/careers",
  "/karriere",
  "/ueber-uns",
  "/team",
  "/info",
  "/wunschpatient",
  "/whats-new",
  "/updates",
  "/blog",
  // Legal pages
  "/impressum",
  "/datenschutz",
  "/agb",
  "/sicherheit",
  "/cookies",
]

const PUBLIC_ROUTE_PREFIXES = ["/features/", "/blog/", "/auth/"]

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) return true

  // Check prefix matches for dynamic routes
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }

  return false
}

const swrConfig = {
  dedupingInterval: 2000,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  keepPreviousData: true,
  errorRetryCount: 2,
  errorRetryInterval: 1000,
}

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser?: User | null
}) {
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Core providers needed on every page
  const coreProviders = (
    <SWRConfig value={swrConfig}>
      <UserProvider initialUser={initialUser}>
        <TranslationProvider>
          <PracticeProvider>
            <SidebarSettingsProvider>
              <ErrorBoundary>
                <RoutePersistence />
                <GlobalDragPrevention />
                {children}
              </ErrorBoundary>
            </SidebarSettingsProvider>
          </PracticeProvider>
        </TranslationProvider>
      </UserProvider>
    </SWRConfig>
  )
  
  // Feature-specific providers - only load after mount to avoid hydration issues
  // These will be loaded on-demand by pages that need them
  if (!mounted || !initialUser) {
    return coreProviders
  }
  
  // Authenticated users get full provider tree
  return (
    <SWRConfig value={swrConfig}>
      <UserProvider initialUser={initialUser}>
        <TranslationProvider>
          <PracticeProvider>
            <SidebarSettingsProvider>
              <OnboardingProvider>
                <TeamProvider>
                  <TodoProvider>
                    <CalendarProvider>
                      <WorkflowProvider>
                        <AnalyticsDataProvider>
                          <ErrorBoundary>
                            <RoutePersistence />
                            <GlobalDragPrevention />
                            {children}
                          </ErrorBoundary>
                        </AnalyticsDataProvider>
                      </WorkflowProvider>
                    </CalendarProvider>
                  </TodoProvider>
                </TeamProvider>
              </OnboardingProvider>
            </SidebarSettingsProvider>
          </PracticeProvider>
        </TranslationProvider>
      </UserProvider>
    </SWRConfig>
  )
}

export default Providers
