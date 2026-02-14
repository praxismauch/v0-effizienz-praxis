"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PanelLeft, Clock } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { usePractice } from "@/contexts/practice-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Fragment } from "react"
import { pathTitles, isUUID } from "@/components/header/constants"
import { HeaderSearch } from "@/components/header/header-search"
import { HeaderActions } from "@/components/header/header-actions"

function AppHeader() {
  const { currentPractice } = usePractice()
  const pathname = usePathname()
  const { state: sidebarState, toggleSidebar } = useSidebar()

  // Generate breadcrumbs from pathname
  const pathSegments = pathname?.split("/").filter(Boolean) || []
  const filteredSegments = pathSegments.filter((segment) => !isUUID(segment))
  const breadcrumbs = filteredSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, pathSegments.indexOf(segment) + 1).join("/")
    const title = pathTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
    return { path, title, isLast: index === filteredSegments.length - 1 }
  })

  const [trialDaysLeft] = useState<number | null>(null)
  const [isTrialActive] = useState(false)
  const [unreadMessagesCount] = useState(0)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      {/* Mobile Sidebar Trigger */}
      <SidebarTrigger className="-ml-1 md:hidden" />

      {sidebarState === "collapsed" && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="-ml-1 hidden md:flex h-9 w-9">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Sidebar offnen</span>
        </Button>
      )}

      <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />

      {/* Breadcrumbs - Hidden */}
      <Breadcrumb className="hidden">
        <BreadcrumbList>
          {breadcrumbs.map((crumb) => (
            <Fragment key={crumb.path}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.path}>{crumb.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Practice Name - Mobile */}
      <span className="text-sm font-medium md:hidden truncate">{currentPractice?.name || "Effizienz Praxis"}</span>

      {isTrialActive && trialDaysLeft !== null && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  trialDaysLeft <= 3
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                    : trialDaysLeft <= 7
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {"Testzeitraum: "}{trialDaysLeft}{" "}{trialDaysLeft === 1 ? "Tag" : "Tage"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {"Ihr Testzeitraum endet in "}{trialDaysLeft}{" "}{trialDaysLeft === 1 ? "Tag" : "Tagen"}{"."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upgrade auf einen kostenpflichtigen Plan fur vollen Zugriff.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Global Search */}
      <HeaderSearch />

      {/* Right Side Actions */}
      <TooltipProvider>
        <HeaderActions unreadMessagesCount={unreadMessagesCount} />
      </TooltipProvider>
    </header>
  )
}

export default AppHeader
