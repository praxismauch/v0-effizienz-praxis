"use client"

import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useOnboarding } from "@/contexts/onboarding-context"
import { useContext } from "react"
import { OnboardingContext } from "@/contexts/onboarding-context"

interface SidebarTourButtonProps {
  sidebarOpen: boolean
}

export function SidebarTourButton({ sidebarOpen }: SidebarTourButtonProps) {
  // Safe check if provider is available - return null during SSR
  const context = useContext(OnboardingContext)
  if (!context) return null
  
  const { isNewPractice, daysRemaining, setIsOnboardingOpen, shouldShowOnboarding } = context

  if (!shouldShowOnboarding) return null

  const buttonContent = (
    <Button
      variant="outline"
      size={sidebarOpen ? "default" : "icon"}
      onClick={() => setIsOnboardingOpen(true)}
      className={cn(
        "w-full gap-2 bg-gradient-to-r from-primary/10 to-primary/5",
        "border-primary/20 hover:border-primary/40 hover:bg-primary/15",
        "text-primary transition-all duration-200",
        !sidebarOpen && "h-10 w-10 p-0"
      )}
    >
      <Calendar className="h-4 w-4" />
      {sidebarOpen && (
        <span className="flex-1 text-left">
          Tour starten
          {isNewPractice && daysRemaining > 0 && (
            <span className="ml-1 text-xs opacity-70">({daysRemaining} Tage)</span>
          )}
        </span>
      )}
    </Button>
  )

  if (!sidebarOpen) {
    return (
      <div className="px-2 py-2 border-b border-sidebar-border/30 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side="right">
            <p>
              Tour starten
              {isNewPractice && daysRemaining > 0 && ` (${daysRemaining} Tage übrig)`}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 border-b border-sidebar-border/30 shrink-0">
      {buttonContent}
    </div>
  )
}
