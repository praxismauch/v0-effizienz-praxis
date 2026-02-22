"use client"

import { Calendar } from "lucide-react"
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
      <div className="px-2 py-1.5 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex w-full items-center justify-center p-1.5 transition-colors hover:opacity-70"
            >
              <Calendar className="h-4 w-4 text-primary" />
            </button>
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
    <div className="px-3 py-1.5 shrink-0">
      <button
        onClick={() => setIsOnboardingOpen(true)}
        className="group flex w-full items-center gap-2 px-1 py-1 text-left transition-colors hover:opacity-80"
      >
        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs text-primary/80 hover:text-primary underline underline-offset-2 decoration-primary/30 transition-colors truncate">
          Tour starten
          {isNewPractice && daysRemaining > 0 && (
            <span className="ml-1 no-underline opacity-70">({daysRemaining}d)</span>
          )}
        </span>
      </button>
    </div>
  )
}
