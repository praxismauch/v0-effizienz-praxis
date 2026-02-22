"use client"

import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useOnboarding } from "@/contexts/onboarding-context"

interface SidebarTourButtonProps {
  sidebarOpen: boolean
}

export function SidebarTourButton({ sidebarOpen }: SidebarTourButtonProps) {
  const onboarding = useOnboarding()
  
  if (!onboarding || !onboarding.shouldShowOnboarding) return null
  
  const { isNewPractice, daysRemaining, setIsOnboardingOpen } = onboarding

  if (!sidebarOpen) {
    return (
      <div className="px-2 py-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full h-8 border-blue-500/50 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300 hover:border-blue-400/60 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-400 dark:hover:bg-blue-400/20"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>
              Tour starten
              {isNewPractice && daysRemaining > 0 && ` (${daysRemaining} Tage)`}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="px-3 py-1 shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOnboardingOpen(true)}
        className="w-full justify-start gap-2 h-8 border-blue-500/50 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300 hover:border-blue-400/60 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-400 dark:hover:bg-blue-400/20"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs font-medium truncate">
          Tour starten
          {isNewPractice && daysRemaining > 0 && (
            <span className="ml-1 opacity-70">({daysRemaining}d)</span>
          )}
        </span>
      </Button>
    </div>
  )
}
