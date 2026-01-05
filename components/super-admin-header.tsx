"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Bug } from "lucide-react"
import { useTheme } from "next-themes"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ReportBugDialog from "@/components/report-bug-dialog"
import { useUser } from "@/contexts/user-context"

export function SuperAdminHeader() {
  const { theme, setTheme } = useTheme()
  const [isBugReportOpen, setIsBugReportOpen] = useState(false)
  const { currentUser } = useUser()

  const handleReportBug = () => {
    setIsBugReportOpen(true)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Super Admin Dashboard</h1>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-8 w-8"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === "dark" ? "Hell-Modus aktivieren" : "Dunkel-Modus aktivieren"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Bug Report Button */}
            <ReportBugDialog
              open={isBugReportOpen}
              onOpenChange={setIsBugReportOpen}
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleReportBug} className="h-8 w-8">
                      <Bug className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bug melden</p>
                  </TooltipContent>
                </Tooltip>
              }
            />

            {/* Display user name without dropdown */}
            <div className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {currentUser?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "SA"}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:inline">{currentUser?.name || "Super Admin"}</span>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}

export default SuperAdminHeader
